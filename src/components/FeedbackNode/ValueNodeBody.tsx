import { Handle, Position } from '@xyflow/react'
import { useDraftValue } from '../../hooks/useDraftValue'
import { useUnitMap } from '../../context/GraphEvalContext'
import { SeriesModePanel } from './SeriesModePanel'
import { unitClass, unitLabel } from './nodeFormatting'
import { useNodeContext } from './NodeContext'

/**
 * Buffered number input — keeps a local draft so `onChange` only fires on
 * blur / Enter, preventing mid-spin re-renders from breaking the browser's
 * native spinner state machine (which caused infinite increment).
 */
function ValueInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { draft, setDraft, focusedRef } = useDraftValue(value)

  function commit(raw: string) {
    const n = parseFloat(raw)
    onChange(isFinite(n) ? n : value)
  }

  return (
    <input
      type="number"
      className="port-value-input"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onFocus={() => { focusedRef.current = true }}
      onBlur={e => { focusedRef.current = false; commit(e.target.value) }}
      onKeyDown={e => {
        if (e.key === 'Enter')  { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur() }
        if (e.key === 'Escape') { setDraft(String(value)); (e.target as HTMLInputElement).blur() }
      }}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    />
  )
}

export function ValueNodeBody() {
  const {
    nodeId, nodeData, variant, showExpanded, displayMode,
    outputs, seriesHistory, seriesChartType, primaryUnit,
    portLabelField, getPortRowDragProps, getDragHandleProps,
    updateOutputValue, cycleOutputUnit, addQuickOutput,
    onChartTypeChange, onSourceUrlChange,
  } = useNodeContext()
  const unitMap = useUnitMap()

  return (
    <div className="node-body value-node-body">
      <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} onChartTypeChange={onChartTypeChange} />
      {outputs.map(port => {
        const resolvedUnit = unitMap.get(`${nodeId}:${port.id}`) ?? port.unit
        return (
          <div key={port.id} {...getPortRowDragProps(port.id, 'output')}>
            <Handle id={port.id} type="source" position={Position.Right} title={port.label} />
            {showExpanded && <span className="port-drag-handle" {...getDragHandleProps(port.id, 'output')}>⠿</span>}
            {showExpanded && portLabelField(port.id, 'output', port.label)}
            {showExpanded && <span className="port-value-eq">=</span>}
            {showExpanded && (
              <ValueInput value={port.value ?? 0} onChange={v => updateOutputValue(port.id, v)} />
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
          </div>
        )
      })}
      {showExpanded && (
        <div className="quick-add-row" style={{ justifyContent: 'flex-end' }}>
          <button className="port-quick-add-btn" onMouseDown={e => e.stopPropagation()} onClick={addQuickOutput} title="Add output">+ out</button>
        </div>
      )}
      {showExpanded && variant === 'measure' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px 4px' }}>
          <span style={{ fontSize: 10, color: '#888', flexShrink: 0 }}>URL</span>
          <input
            value={nodeData.sourceUrl ?? ''}
            onChange={e => onSourceUrlChange(e.target.value || undefined)}
            placeholder="/api/range?min=0&max=100"
            style={{ flex: 1, fontSize: 10, padding: '1px 4px', border: '1px solid #b0cce8', borderRadius: 3, fontFamily: 'monospace', minWidth: 0 }}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
