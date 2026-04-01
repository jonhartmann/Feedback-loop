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
      className="port__value"
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
    onSourceUrlChange,
  } = useNodeContext()

  return (
    <div className="feedback-node__body feedback-node__body--value">
      <SeriesModePanel showExpanded={showExpanded} displayMode={displayMode} seriesHistory={seriesHistory} seriesChartType={seriesChartType} primaryUnit={primaryUnit} />
      {outputs.map(port => {
        if (variant === 'constant' || variant === 'measure') {
          return (
            <div key={port.id} className="port__row" style={showExpanded ? { justifyContent: 'flex-end' } : undefined}>
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
        <div className="feedback-node__url-row">
          <span className="feedback-node__url-label">URL</span>
          <input
            className="feedback-node__url-input"
            value={nodeData.sourceUrl ?? ''}
            onChange={e => onSourceUrlChange(e.target.value || undefined)}
            placeholder="/api/range?min=0&max=100"
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
