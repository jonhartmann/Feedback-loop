import { useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { XYPosition } from '@xyflow/react'
import { useLibraryContext } from '../context/LibraryContext'
import type { LibraryItem, NodeTemplate, NodeVariant } from '../types/graph'
import { btn, iconBtn } from './DrawerStyles'
import { ItemForm } from './ItemForm'
import { LibraryItemRow } from './LibraryItemRow'

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
    <div style={{
      position: 'absolute', right: 0, top: 0, height: '100%', width: 260,
      background: '#16162a', borderLeft: '1px solid #2a2a4a', zIndex: 10,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '9px 10px', borderBottom: '1px solid #2a2a4a', flexShrink: 0, gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#c0c0e0', flex: 1 }}>Library</span>
        <button style={{ ...btn(true), fontSize: 11 }} onClick={() => { setShowNewForm(v => !v); setEditingId(null) }}>
          + New
        </button>
        <button
          style={{ ...iconBtn, color: '#555577', fontSize: 10 }}
          title="Reset to defaults"
          onClick={() => { if (confirm('Reset library to defaults? This will remove all custom items.')) resetToDefaults() }}
        >↺</button>
        <button style={{ ...iconBtn, fontSize: 15 }} onClick={onClose} title="Close library">✕</button>
      </div>

      {/* New item form */}
      {showNewForm && (
        <ItemForm
          onSave={item => { addItem(item); setShowNewForm(false) }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Items list — one section per entity type */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {TYPE_ORDER.map(typeKey => {
          const group = grouped[typeKey]
          if (group.length === 0) return null
          return (
            <div key={typeKey} style={{ marginBottom: 6 }}>
              <div style={{ padding: '4px 12px 5px', fontSize: 10, fontWeight: 700, color: '#55558a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
          <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 11, color: '#444466' }}>
            No items. Click "+ New" to add one.
          </div>
        )}
      </div>
    </div>
  )
}
