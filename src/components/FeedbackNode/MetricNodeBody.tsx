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
    setMetricUnit, onMetricFormulaChange, onChartTypeChange,
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
    <div className="node-body metric-body">
      <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} onChartTypeChange={onChartTypeChange} />
      <InputsColumn />

      {showExpanded && (
        <div className="metric-formula-panel">
          <FormulaInput
            className="metric-formula-input"
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
            <span className={`metric-result${metricDisplay.isError ? ' is-error' : ''}`}>
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
  )
}
