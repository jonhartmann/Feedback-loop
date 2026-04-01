import { useState } from 'react'
import clsx from 'clsx'
import { useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData } from '../../types/graph'
import { useNodeContext } from './NodeContext'
import type { ChartType } from './SeriesModePanel'

type DisplayOption = 'value' | ChartType

const OPTIONS: { id: DisplayOption; symbol: string; label: string }[] = [
  { id: 'value', symbol: '⊟', label: 'Value'      },
  { id: 'area',  symbol: '◿', label: 'Area chart' },
  { id: 'bar',   symbol: '▮▮', label: 'Bar chart' },
]

export function DisplayModeDropdown() {
  const { nodeId, displayMode, seriesChartType, hasMeasureInput, variant } = useNodeContext()
  const { updateNodeData } = useReactFlow()
  const [open, setOpen] = useState(false)

  if (variant === 'constant') return null
  if (variant !== 'measure' && !hasMeasureInput) return null

  const current: DisplayOption = displayMode === 'series' ? seriesChartType : 'value'
  const currentOpt = OPTIONS.find(o => o.id === current) ?? OPTIONS[0]

  function select(id: DisplayOption) {
    if (id === 'value') {
      updateNodeData(nodeId, { displayMode: undefined } as Partial<FeedbackNodeData>)
    } else {
      updateNodeData(nodeId, { displayMode: 'series', seriesChartType: id } as Partial<FeedbackNodeData>)
    }
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={clsx('feedback-node__display-btn', {
          'feedback-node__display-btn--series': displayMode === 'series',
        })}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Display mode"
      >
        {currentOpt.symbol}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onMouseDown={e => { e.stopPropagation(); setOpen(false) }}
          />
          <ul className="feedback-node__display-list">
            {OPTIONS.map(opt => (
              <li
                key={opt.id}
                className={clsx('feedback-node__display-option', {
                  'feedback-node__display-option--active': opt.id === current,
                })}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); select(opt.id) }}
              >
                <span className="feedback-node__display-symbol">{opt.symbol}</span>
                <span>{opt.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
