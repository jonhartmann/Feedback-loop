import { METRIC_PORT_ID } from '../../types/graph'
import { formatValue } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import SeriesChart from './SeriesChart'
import { useNodeContext } from './NodeContext'
import type { Unit } from '../../types/graph'

function unitMod(block: string, u: Unit | undefined): string {
  if (u === 'money')   return ` ${block}--money`
  if (u === 'percent') return ` ${block}--percent`
  return ''
}

export function NodeSummaryOverlay() {
  const {
    nodeId, nodeData, displayMode, isValueNode, isMetric, isSingleOutputRegular,
    outputs, seriesHistory, seriesChartType, primaryUnit, primaryValue,
  } = useNodeContext()
  const activeEvalMap = useEvalMap()
  const unitMap = useUnitMap()

  const hasMultipleRows = !isValueNode && !isMetric && outputs.length > 1

  const overlayClass = [
    'node-summary',
    displayMode === 'series'  ? 'node-summary--series' : '',
    hasMultipleRows           ? 'node-summary--rows'   : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={overlayClass}>
      {displayMode === 'series' && (
        <div style={{ position: 'relative', width: '100%' }}>
          {seriesHistory.length >= 2
            ? <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} height={66} />
            : <div className="feedback-node__series-empty" style={{ height: 66 }}>—</div>
          }
          {primaryValue !== undefined && (
            <span className={`node-summary__series-value${unitMod('node-summary__series-value', primaryUnit)}`}>
              {formatValue(primaryValue, primaryUnit)}
            </span>
          )}
        </div>
      )}
      {displayMode !== 'series' && (<>
        {isValueNode && (
          outputs.length === 0
            ? <span className="node-summary__value node-summary__value--empty">—</span>
            : outputs.map(port => (
                <div key={port.id} className="node-summary__value-block">
                  {outputs.length > 1 && <span className="node-summary__value-label">{port.label}</span>}
                  <span className={`node-summary__value${unitMod('node-summary__value', port.unit)}`}>
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
            <span className={`node-summary__value${unitMod('node-summary__value', resolvedUnit)}`}>
              {metricVal !== undefined ? formatValue(metricVal, resolvedUnit) : nodeData.metricFormula ? '…' : '—'}
            </span>
          )
        })()}

        {!isValueNode && !isMetric && (
          isSingleOutputRegular ? (
            (() => {
              const port = outputs[0]
              if (!port) return <span className="node-summary__value node-summary__value--empty">no outputs</span>
              const val = activeEvalMap.get(`${nodeId}:${port.id}`)
              const unit = unitMap.get(`${nodeId}:${port.id}`) ?? port.unit
              return (
                <span className={`node-summary__value${unitMod('node-summary__value', unit)}`}>
                  {val !== undefined ? formatValue(val, unit) : '—'}
                </span>
              )
            })()
          ) : outputs.length === 0 ? (
            <span className="node-summary__value node-summary__value--empty">no outputs</span>
          ) : (
            outputs.map(port => {
              const val = activeEvalMap.get(`${nodeId}:${port.id}`)
              const unit = unitMap.get(`${nodeId}:${port.id}`) ?? port.unit
              return (
                <div key={port.id} className="node-summary__row">
                  <span className="node-summary__row-label">{port.label}</span>
                  <span className={`node-summary__row-value${unitMod('node-summary__row-value', unit)}`}>
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
