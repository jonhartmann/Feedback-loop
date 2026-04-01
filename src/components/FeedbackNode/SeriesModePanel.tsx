import type { Unit } from '../../types/graph'
import SeriesChart from './SeriesChart'

export type ChartType = 'area' | 'bar'

export function SeriesModePanel({
  showExpanded, displayMode, seriesHistory, seriesChartType, primaryUnit,
}: {
  showExpanded: boolean
  displayMode: 'value' | 'series'
  seriesHistory: number[]
  seriesChartType: ChartType
  primaryUnit: Unit | undefined
}) {
  if (displayMode !== 'series') return null
  return (
    <>
      {showExpanded && seriesHistory.length > 0 && (
        <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} />
      )}
      {showExpanded && seriesHistory.length === 0 && (
        <div className="feedback-node__series-empty">Waiting for data…</div>
      )}
    </>
  )
}
