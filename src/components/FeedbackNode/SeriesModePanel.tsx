import type { Unit } from '../../types/graph'
import SeriesChart from './SeriesChart'

export type ChartType = 'line' | 'area' | 'bar'

export function SeriesModePanel({
  showExpanded, displayMode, seriesHistory, seriesChartType, primaryUnit, gridSpan,
}: {
  showExpanded: boolean
  displayMode: 'value' | 'series'
  seriesHistory: number[]
  seriesChartType: ChartType
  primaryUnit: Unit | undefined
  gridSpan?: boolean
}) {
  if (displayMode !== 'series') return null
  const spanStyle: React.CSSProperties | undefined = gridSpan ? { gridColumn: '1 / -1' } : undefined
  return (
    <>
      {showExpanded && seriesHistory.length > 0 && (
        gridSpan
          ? <div style={spanStyle}><SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} /></div>
          : <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} />
      )}
      {showExpanded && seriesHistory.length === 0 && (
        <div className="feedback-node__series-empty" style={spanStyle}>Waiting for data…</div>
      )}
    </>
  )
}
