import { Handle, Position } from '@xyflow/react'
import { useDraftValue } from '../../hooks/useDraftValue'
import { SeriesModePanel } from './SeriesModePanel'
import { UnitDropdown } from './UnitDropdown'
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
    nodeData, variant, showExpanded, displayMode,
    outputs, seriesHistory, seriesChartType, primaryUnit,
    updateOutputValue, setOutputUnit,
    onChartTypeChange, onSourceUrlChange,
  } = useNodeContext()

  return (
    <div className="node-body value-node-body">
      <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} onChartTypeChange={onChartTypeChange} />
      {outputs.map(port => {
        if (variant === 'constant' || variant === 'measure') {
          return (
            <div key={port.id} className="port-row" style={showExpanded ? { justifyContent: 'flex-end' } : undefined}>
              <Handle id={port.id} type="source" position={Position.Right} title={port.label} />
              {showExpanded && <ValueInput value={port.value ?? 0} onChange={v => updateOutputValue(port.id, v)} />}
              {showExpanded && (
                <UnitDropdown unit={port.unit} onChange={u => setOutputUnit(port.id, u)} />
              )}
            </div>
          )
        }
      })}

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
