import { METRIC_PORT_ID } from '../../types/graph'
import { formatValue } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import SeriesChart from './SeriesChart'
import { unitClass } from './nodeFormatting'
import { useNodeContext } from './NodeContext'

export function NodeSummaryOverlay() {
  const {
    nodeId, nodeData, displayMode, isValueNode, isMetric, isSingleOutputRegular,
    outputs, seriesHistory, seriesChartType, primaryUnit, primaryValue,
  } = useNodeContext()
  const activeEvalMap = useEvalMap()
  const unitMap = useUnitMap()

  return (
    <div className={`node-summary-overlay${displayMode === 'series' ? ' is-series-collapsed' : ''}`}>
      {displayMode === 'series' && (
        <div style={{ position: 'relative', width: '100%' }}>
          {seriesHistory.length >= 2
            ? <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} height={66} />
            : <div style={{ height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#bbb' }}>—</div>
          }
          {primaryValue !== undefined && (
            <span className={`series-collapsed-value${unitClass(primaryUnit)}`}>
              {formatValue(primaryValue, primaryUnit)}
            </span>
          )}
        </div>
      )}
      {displayMode !== 'series' && (<>
        {isValueNode && (
          outputs.length === 0
            ? <span className="summary-value is-empty">—</span>
            : outputs.map(port => (
                <div key={port.id} className="summary-value-block">
                  {outputs.length > 1 && <span className="summary-value-label">{port.label}</span>}
                  <span className={`summary-value${unitClass(port.unit)}`}>
                    {port.value !== undefined ? formatValue(port.value, port.unit) : '—'}
                  </span>
                </div>
              ))
        )}

        {isMetric && (() => {
          const metricKey = `${nodeId}:${METRIC_PORT_ID}`
          const metricVal = activeEvalMap.get(metricKey)
          const resolvedUnit = unitMap.get(metricKey) ?? nodeData.metricUnit
          return (
            <span className={`summary-value${unitClass(resolvedUnit)}`}>
              {metricVal !== undefined ? formatValue(metricVal, resolvedUnit) : nodeData.metricFormula ? '…' : '—'}
            </span>
          )
        })()}

        {!isValueNode && !isMetric && (
          isSingleOutputRegular ? (
            (() => {
              const port = outputs[0]
              if (!port) return <span className="summary-value is-empty">no outputs</span>
              const val = activeEvalMap.get(`${nodeId}:${port.id}`)
              const unit = unitMap.get(`${nodeId}:${port.id}`) ?? port.unit
              return (
                <span className={`summary-value${unitClass(unit)}`}>
                  {val !== undefined ? formatValue(val, unit) : '—'}
                </span>
              )
            })()
          ) : outputs.length === 0 ? (
            <span className="summary-value is-empty">no outputs</span>
          ) : (
            outputs.map(port => {
              const val = activeEvalMap.get(`${nodeId}:${port.id}`)
              const unit = unitMap.get(`${nodeId}:${port.id}`) ?? port.unit
              return (
                <div key={port.id} className="summary-output-row">
                  <span className="summary-output-label">{port.label}</span>
                  <span className={`summary-output-value${unitClass(unit)}`}>
                    {val !== undefined ? formatValue(val, unit) : '—'}
                  </span>
                </div>
              )
            })
          )
        )}
      </>)}
    </div>
  )
}
