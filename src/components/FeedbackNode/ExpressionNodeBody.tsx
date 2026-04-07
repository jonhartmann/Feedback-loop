import clsx from 'clsx'
import { Handle, Position } from '@xyflow/react'
import { evalFormula, formatValue, labelToVarName, FORMULA_BUILTINS } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import FormulaInput from './FormulaInput'
import { SeriesModePanel } from './SeriesModePanel'
import { InputsColumn } from './InputsColumn'
import { UnitDropdown } from './UnitDropdown'
import { useNodeContext } from './NodeContext'

export function ExpressionNodeBody() {
  const {
    nodeId, showExpanded, displayMode,
    inputs, outputs, seriesHistory, seriesChartType, primaryUnit,
    setOutputUnit, onOutputFormulaChange,
  } = useNodeContext()
  const activeEvalMap = useEvalMap()
  const unitMap = useUnitMap()

  return (
    <>
      <div className="feedback-node__body">
        <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} gridSpan />
        <InputsColumn />

        <div className="feedback-node__column feedback-node__column--outputs">
          {outputs.map(port => {
            const graphValue = activeEvalMap.get(`${nodeId}:${port.id}`)
            const resolvedUnit = unitMap.get(`${nodeId}:${port.id}`) ?? port.unit
            // Local preview with no scope — shows formula text until graph resolves a value
            const localResult = port.formula ? evalFormula(port.formula, {}) : null

            let display: { text: string; isError: boolean } | null = null
            if (port.formula) {
              if (graphValue !== undefined) {
                display = { text: `= ${formatValue(graphValue, resolvedUnit)}`, isError: false }
              } else if (localResult?.type === 'error') {
                display = { text: '⚠ ' + localResult.message, isError: true }
              } else {
                display = { text: `= ${port.formula}`, isError: false }
              }
            }

            return (
              <div key={port.id} className="port__row feedback-node__formula-panel">
                <Handle id={port.id} type="source" position={Position.Right} title={port.label} />
                {showExpanded && (
                  <FormulaInput
                    className="feedback-node__formula-input"
                    placeholder="formula…"
                    value={port.formula ?? ''}
                    onChange={v => onOutputFormulaChange(port.id, v || undefined)}
                    variables={inputs.map(i => labelToVarName(i.label)).filter(Boolean)}
                    builtins={FORMULA_BUILTINS}
                    onMouseDown={e => e.stopPropagation()}
                  />
                )}
                {showExpanded && display && (
                  <span className={clsx('feedback-node__formula-result', { 'feedback-node__formula-result--error': display.isError })}>{display.text}</span>
                )}
                {showExpanded && (
                  <UnitDropdown
                    unit={port.unit}
                    onChange={u => setOutputUnit(port.id, u)}
                    style={{ alignSelf: 'flex-end' }}
                  />
                )}
              </div>
            )
          })}
          {showExpanded && outputs.length === 0 && <span className="feedback-node__empty-note">no outputs</span>}
        </div>
      </div>
    </>
  )
}
