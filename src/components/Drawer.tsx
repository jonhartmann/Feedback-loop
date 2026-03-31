import { useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { XYPosition } from '@xyflow/react'
import { useLibraryContext } from '../context/LibraryContext'
import type { LibraryItem, NodeTemplate, NodeVariant } from '../types/graph'
import { ItemForm } from './ItemForm'
import { LibraryItemRow } from './LibraryItemRow'
import './Drawer.css'

// ── Group by entity type ──────────────────────────────────────────────────────

const TYPE_ORDER: NodeVariant[] = ['constant', 'measure', 'expression', 'metric']
const TYPE_LABELS: Record<NodeVariant, string> = {
  constant:   'Constants',
  measure:    'Measures',
  expression: 'Expressions',
  metric:     'Metrics',
}

function itemTypeKey(item: LibraryItem): NodeVariant {
  return item.template.variant ?? 'expression'
}

interface DrawerProps {
  onClose: () => void
  addNode: (pos: XYPosition, template?: NodeTemplate) => void
}

// ── Main drawer ───────────────────────────────────────────────────────────────

export default function Drawer({ onClose, addNode }: DrawerProps) {
  const { items, addItem, updateItem, removeItem, resetToDefaults } = useLibraryContext()
  const { screenToFlowPosition } = useReactFlow()
  const [editingId, setEditingId]    = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  const grouped: Record<NodeVariant, LibraryItem[]> = { constant: [], measure: [], expression: [], metric: [] }
  for (const item of items) grouped[itemTypeKey(item)].push(item)

  function addToCanvas(template: NodeTemplate) {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2 - 120, y: window.innerHeight / 2 - 40 })
    addNode(pos, template)
  }

  function handleDragStart(e: React.DragEvent, template: NodeTemplate) {
    e.dataTransfer.setData('application/feedback-node', JSON.stringify(template))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="drawer">
      {/* Header */}
      <div className="drawer__header">
        <span className="drawer__title">Library</span>
        <button
          className="drawer__btn drawer__btn--primary"
          onClick={() => { setShowNewForm(v => !v); setEditingId(null) }}
        >
          + New
        </button>
        <button
          className="drawer__icon-btn"
          title="Reset to defaults"
          onClick={() => { if (confirm('Reset library to defaults? This will remove all custom items.')) resetToDefaults() }}
        >↺</button>
        <button className="drawer__icon-btn" onClick={onClose} title="Close library">✕</button>
      </div>

      {/* New item form */}
      {showNewForm && (
        <ItemForm
          onSave={item => { addItem(item); setShowNewForm(false) }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Items list — one section per entity type */}
      <div className="drawer__body">
        {TYPE_ORDER.map(typeKey => {
          const group = grouped[typeKey]
          if (group.length === 0) return null
          return (
            <div key={typeKey} className="drawer__section">
              <div className="drawer__section-label">
                {TYPE_LABELS[typeKey]}
              </div>

              {group.map(item =>
                editingId === item.id ? (
                  <ItemForm
                    key={item.id}
                    initialValues={item}
                    onSave={updates => { updateItem(item.id, updates); setEditingId(null) }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <LibraryItemRow
                    key={item.id}
                    item={item}
                    onDragStart={handleDragStart}
                    onAddToCanvas={() => addToCanvas(item.template)}
                    onEdit={() => { setEditingId(item.id); setShowNewForm(false) }}
                    onDelete={() => removeItem(item.id)}
                  />
                )
              )}
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="drawer__empty">
            No items. Click "+ New" to add one.
          </div>
        )}
      </div>
    </div>
  )
}
