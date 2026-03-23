import type { Unit } from '../../types/graph'
import SeriesChart from './SeriesChart'

export type ChartType = 'line' | 'area' | 'bar'

const CHART_ICONS: Record<ChartType, string> = { line: '∿', area: '◿', bar: '▮▮' }

export function ChartTypeSelector({ current, onChange, wrapperStyle }: {
  current: ChartType
  onChange: (t: ChartType) => void
  wrapperStyle?: React.CSSProperties
}) {
  return (
    <div className="chart-type-row" style={wrapperStyle}>
      {(['line', 'area', 'bar'] as const).map(t => (
        <button key={t} className={`chart-type-btn${current === t ? ' active' : ''}`}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onChange(t) }}
          title={t}
        >{CHART_ICONS[t]}</button>
      ))}
    </div>
  )
}

export function SeriesModePanel({
  showExpanded, displayMode, seriesHistory, seriesChartType, primaryUnit, onChartTypeChange, gridSpan,
}: {
  showExpanded: boolean
  displayMode: 'value' | 'series'
  seriesHistory: number[]
  seriesChartType: ChartType
  primaryUnit: Unit | undefined
  onChartTypeChange: (t: ChartType) => void
  gridSpan?: boolean
}) {
  if (displayMode !== 'series') return null
  const spanStyle: React.CSSProperties | undefined = gridSpan ? { gridColumn: '1 / -1' } : undefined
  return (
    <>
      {showExpanded && (
        <ChartTypeSelector current={seriesChartType} onChange={onChartTypeChange} wrapperStyle={spanStyle} />
      )}
      {showExpanded && seriesHistory.length > 0 && (
        gridSpan
          ? <div style={spanStyle}><SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} /></div>
          : <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} />
      )}
      {showExpanded && seriesHistory.length === 0 && (
        <div className="series-empty" style={spanStyle}>Waiting for data…</div>
      )}
    </>
  )
}
