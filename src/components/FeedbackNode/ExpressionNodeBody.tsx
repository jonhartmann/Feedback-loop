import { Handle, Position } from '@xyflow/react'
import { evalFormula, buildScope, formatValue, labelToVarName, FORMULA_BUILTINS } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import FormulaInput from './FormulaInput'
import { SeriesModePanel } from './SeriesModePanel'
import { InputsColumn } from './InputsColumn'
import { UnitDropdown } from './UnitDropdown'
import { useNodeContext } from './NodeContext'

export function ExpressionNodeBody() {
  const {
    nodeId, nodeData, showExpanded, displayMode,
    inputs, outputs, variables, seriesHistory, seriesChartType, primaryUnit,
    setOutputUnit, onChartTypeChange, onOutputFormulaChange,
  } = useNodeContext()
  const activeEvalMap = useEvalMap()
  const unitMap = useUnitMap()
  const localScope = buildScope(variables, new Map())

  return (
    <>
      <div className="node-body">
        <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} onChartTypeChange={onChartTypeChange} gridSpan />
        <InputsColumn />

        <div className="ports-column outputs">
          {outputs.map(port => {
            const graphValue = activeEvalMap.get(`${nodeId}:${port.id}`)
            const resolvedUnit = unitMap.get(`${nodeId}:${port.id}`) ?? port.unit
            const localResult = port.formula ? evalFormula(port.formula, localScope) : null

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
              <div
                key={port.id}
                className="port-row"
                style={showExpanded ? { flexDirection: 'column', alignItems: 'stretch', flex: 1, borderLeft: '1px dashed #d0b0f0', padding: '6px 8px', gap: 4, minWidth: 120 } : undefined}
              >
                <Handle id={port.id} type="source" position={Position.Right} title={port.label} />
                {showExpanded && (
                  <FormulaInput
                    className="metric-formula-input"
                    placeholder="formula…"
                    value={port.formula ?? ''}
                    onChange={v => onOutputFormulaChange(port.id, v || undefined)}
                    variables={[
                      ...inputs.map(i => labelToVarName(i.label)),
                      ...variables.filter(v => /^[a-zA-Z_]\w*$/.test(v.name)).map(v => v.name),
                    ].filter(Boolean)}
                    builtins={FORMULA_BUILTINS}
                    onMouseDown={e => e.stopPropagation()}
                  />
                )}
                {showExpanded && display && (
                  <span className={`metric-result${display.isError ? ' is-error' : ''}`}>{display.text}</span>
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
          {showExpanded && outputs.length === 0 && <span style={{ fontSize: 11, color: '#aaa' }}>no outputs</span>}
        </div>
      </div>

      {showExpanded && nodeData.description && (
        <div className="node-meta">
          <p className="node-description">{nodeData.description}</p>
        </div>
      )}
    </>
  )
}
