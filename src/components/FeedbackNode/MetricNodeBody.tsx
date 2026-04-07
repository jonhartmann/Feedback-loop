import clsx from 'clsx'
import { METRIC_PORT_ID } from '../../types/graph'
import { evalFormula, labelToVarName, formatValue, FORMULA_BUILTINS } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import FormulaInput from './FormulaInput'
import { SeriesModePanel } from './SeriesModePanel'
import { InputsColumn } from './InputsColumn'
import { UnitDropdown } from './UnitDropdown'
import { useNodeContext } from './NodeContext'

export function MetricNodeBody() {
  const {
    nodeId, nodeData, showExpanded, displayMode,
    inputs, seriesHistory, seriesChartType, primaryUnit,
    onMetricPortChange, onChartTypeChange,
  } = useNodeContext()
  const activeEvalMap = useEvalMap()
  const unitMap = useUnitMap()

  const metricPort = nodeData.outputs.find(p => p.id === METRIC_PORT_ID)
  const metricFormula = metricPort?.formula
  const metricUnit = metricPort?.unit
  const metricKey = `${nodeId}:${METRIC_PORT_ID}`
  const metricGraphValue = activeEvalMap.get(metricKey)
  const metricResolvedUnit = unitMap.get(metricKey) ?? metricUnit

  // Local preview scope — inputs may not be connected yet
  const localScope: Record<string, number> = {}
  for (const input of inputs) {
    if (input.value !== undefined) localScope[labelToVarName(input.label)] = input.value
  }
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
      <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} onChartTypeChange={onChartTypeChange} gridSpan />
      <InputsColumn />

      {showExpanded && (
        <div className="feedback-node__formula-panel">
          <FormulaInput
            className="feedback-node__formula-input"
            placeholder="formula…"
            value={metricFormula ?? ''}
            onChange={v => onMetricPortChange({ formula: v || undefined })}
            variables={inputs.map(i => labelToVarName(i.label)).filter(Boolean)}
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
            onChange={u => onMetricPortChange({ unit: u })}
            style={{ alignSelf: 'flex-end' }}
          />
        </div>
      )}
    </div>
  )
}
