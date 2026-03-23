import { Handle, Position } from '@xyflow/react'
import { evalFormula, buildScope, formatValue } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import PortEditor from './PortEditor'
import { SeriesModePanel } from './SeriesModePanel'
import { InputsColumn } from './InputsColumn'
import { unitClass, unitLabel } from './nodeFormatting'
import { useNodeContext } from './NodeContext'

export function ExpressionNodeBody({ showEditor }: { showEditor: boolean }) {
  const {
    nodeId, nodeData, showExpanded, displayMode,
    inputs, outputs, variables, seriesHistory, seriesChartType, primaryUnit,
    portLabelField, getPortRowDragProps, getDragHandleProps,
    addQuickOutput, cycleOutputUnit, onChartTypeChange,
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

            let computedValue: number | undefined
            let formulaError: string | undefined
            if (port.formula) {
              if (graphValue !== undefined) {
                computedValue = graphValue
              } else {
                const local = evalFormula(port.formula, localScope)
                if (local.type === 'error') formulaError = local.message
              }
            }

            return (
              <div key={port.id} {...getPortRowDragProps(port.id, 'output')}>
                <Handle id={port.id} type="source" position={Position.Right} title={port.label} />
                {showExpanded && <span className="port-drag-handle" {...getDragHandleProps(port.id, 'output')}>⠿</span>}
                {showExpanded && portLabelField(port.id, 'output', port.label)}
                {showExpanded && formulaError && (
                  <span className="port-formula-display is-error" title={formulaError}>⚠</span>
                )}
                {showExpanded && (
                  <button
                    className={`unit-cycle-btn${unitClass(port.unit)}`}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); cycleOutputUnit(port.id) }}
                    title={`Unit: ${resolvedUnit ?? 'number'} — click to cycle`}
                  >
                    {unitLabel(port.unit)}
                  </button>
                )}
                {showExpanded && computedValue !== undefined && (
                  <div className={`port-value-float${unitClass(resolvedUnit)}`}>
                    {formatValue(computedValue, resolvedUnit)}
                  </div>
                )}
              </div>
            )
          })}
          {showExpanded && outputs.length === 0 && <span style={{ fontSize: 11, color: '#aaa' }}>no outputs</span>}
          {showExpanded && (
            <div className="quick-add-row" style={{ justifyContent: 'flex-end' }}>
              <button className="port-quick-add-btn" onMouseDown={e => e.stopPropagation()} onClick={addQuickOutput} title="Add output">+ out</button>
            </div>
          )}
        </div>
      </div>

      {showExpanded && !showEditor && nodeData.description && (
        <div className="node-meta">
          <p className="node-description">{nodeData.description}</p>
        </div>
      )}

      {showExpanded && showEditor && (
        <div className="port-editor-wrapper">
          <PortEditor
            nodeId={nodeId}
            inputs={inputs}
            outputs={outputs}
            description={nodeData.description}
            variables={variables}
          />
        </div>
      )}
    </>
  )
}
