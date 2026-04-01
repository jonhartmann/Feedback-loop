import clsx from 'clsx'
import { METRIC_PORT_ID } from '../../types/graph'
import { evalFormula, buildScope, labelToVarName, formatValue, FORMULA_BUILTINS } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import FormulaInput from './FormulaInput'
import { SeriesModePanel } from './SeriesModePanel'
import { InputsColumn } from './InputsColumn'
import { UnitDropdown } from './UnitDropdown'
import { useNodeContext } from './NodeContext'

export function MetricNodeBody() {
  const {
    nodeId, nodeData, showExpanded, displayMode,
    inputs, variables, seriesHistory, seriesChartType, primaryUnit,
    setMetricUnit, onMetricFormulaChange,
  } = useNodeContext()
  const activeEvalMap = useEvalMap()
  const unitMap = useUnitMap()

  const metricFormula = nodeData.metricFormula
  const metricUnit = nodeData.metricUnit
  const metricKey = `${nodeId}:${METRIC_PORT_ID}`
  const metricGraphValue = activeEvalMap.get(metricKey)
  const metricResolvedUnit = unitMap.get(metricKey) ?? metricUnit
  const localScope = buildScope(variables, new Map())
  const metricLocalResult = metricFormula ? evalFormula(metricFormula, localScope) : null

  let metricDisplay: { text: string; isError: boolean } | null = null
  if (metricFormula) {
    if (metricGraphValue !== undefined) {
      metricDisplay = { text: `= ${formatValue(metricGraphValue, metricResolvedUnit)}`, isError: false }
    } else if (metricLocalResult?.type === 'error') {
      metricDisplay = { text: '⚠ ' + metricLocalResult.message, isError: true }
    } else {
      metricDisplay = { text: `= ${metricFormula}`, isError: false }
    }
  }

  return (
    <div className="feedback-node__body feedback-node__body--metric">
      <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} />
      <div className="feedback-node__body-columns">
      <InputsColumn />

      {showExpanded && (
        <div className="feedback-node__formula-panel" style={{ flex: 1 }}>
          <FormulaInput
            className="feedback-node__formula-input"
            placeholder="formula…"
            value={metricFormula ?? ''}
            onChange={v => onMetricFormulaChange(v || undefined)}
            variables={[
              ...inputs.map(i => labelToVarName(i.label)),
              ...variables.filter(v => /^[a-zA-Z_]\w*$/.test(v.name)).map(v => v.name),
            ].filter(Boolean)}
            builtins={FORMULA_BUILTINS}
            onMouseDown={e => e.stopPropagation()}
          />
          {metricDisplay && (
            <span className={clsx('feedback-node__formula-result', { 'feedback-node__formula-result--error': metricDisplay.isError })}>
              {metricDisplay.text}
            </span>
          )}
          <UnitDropdown
            unit={metricUnit}
            onChange={setMetricUnit}
            style={{ alignSelf: 'flex-end' }}
          />
        </div>
      )}
      </div>
    </div>
  )
}
