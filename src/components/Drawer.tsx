import { useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { XYPosition } from '@xyflow/react'
import { useLibraryContext } from '../context/LibraryContext'
import type { LibraryItem, NodeTemplate, NodeVariant, Unit } from '../types/graph'

// ── Shared styles ─────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', fontSize: 11,
  padding: '3px 6px', background: '#0e0e20', color: '#c0c0e0',
  border: '1px solid #2a2a4a', borderRadius: 3, outline: 'none', marginBottom: 4,
}
const btn = (primary?: boolean): React.CSSProperties => ({
  fontSize: 11, padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
  border: 'none', background: primary ? '#2255aa' : '#1c1c34',
  color: primary ? '#d0e0ff' : '#8080a0',
})
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '0 3px',
  fontSize: 12, lineHeight: 1, color: '#6060a0',
}

// ── Group by entity type ──────────────────────────────────────────────────────

type TypeKey = 'constant' | 'measure' | 'metric' | 'regular'

const TYPE_ORDER: TypeKey[] = ['constant', 'measure', 'regular', 'metric']
const TYPE_LABELS: Record<TypeKey, string> = {
  constant: 'Constants',
  measure:  'Measures',
  regular:  'Expressions',
  metric:   'Metrics',
}

function itemTypeKey(item: LibraryItem): TypeKey {
  return (item.template.variant as TypeKey | undefined) ?? 'regular'
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DrawerProps {
  onClose: () => void
  addNode: (pos: XYPosition, template?: NodeTemplate) => void
}

// ── Item form (new or edit) ───────────────────────────────────────────────────

function ItemForm({
  initialValues,
  onSave,
  onCancel,
}: {
  initialValues?: LibraryItem
  onSave: (item: Omit<LibraryItem, 'id'>) => void
  onCancel: () => void
}) {
  const t = initialValues?.template
  const [label, setLabel]     = useState(initialValues?.label ?? '')
  const [variant, setVariant] = useState<string>(t?.variant ?? 'constant')
  const [value, setValue]     = useState(t?.value ?? 0)
  const [unit, setUnit]       = useState<Unit>(t?.unit ?? t?.metricUnit ?? 'number')
  const [sourceUrl, setSourceUrl] = useState(t?.sourceUrl ?? '')
  const [formula, setFormula] = useState(t?.metricFormula ?? '')
  const [displayMode, setDisplayMode] = useState<'value' | 'series'>(t?.displayMode ?? 'value')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>(t?.seriesChartType ?? 'line')

  function handleSave() {
    if (!label.trim()) return
    const template: NodeTemplate = { label: label.trim() }
    if (variant !== 'regular') template.variant = variant as NodeVariant
    if (variant === 'constant') { template.value = value; if (unit !== 'number') template.unit = unit }
    if (variant === 'measure')  { template.sourceUrl = sourceUrl || undefined; if (unit !== 'number') template.unit = unit }
    if (variant === 'metric')   { template.metricFormula = formula || undefined; if (unit !== 'number') template.metricUnit = unit }
    if (variant !== 'constant' && displayMode === 'series') {
      template.displayMode = 'series'
      template.seriesChartType = chartType
    }
    onSave({ label: label.trim(), template })
  }

  return (
    <div style={{ padding: '8px 12px', background: '#111128', borderBottom: '1px solid #2a2a4a' }}>
      <input style={inp} value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" autoFocus />

      <select style={{ ...inp, marginBottom: 4 }} value={variant} onChange={e => setVariant(e.target.value)}>
        <option value="constant">Constant</option>
        <option value="measure">Measure</option>
        <option value="metric">Metric</option>
        <option value="regular">Expression</option>
      </select>

      {variant === 'constant' && <>
        <input style={inp} type="number" value={value} onChange={e => setValue(parseFloat(e.target.value) || 0)} placeholder="Value" />
        <UnitSelect value={unit} onChange={setUnit} />
      </>}

      {variant === 'measure' && <>
        <input style={inp} value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Source URL (optional)" />
        <UnitSelect value={unit} onChange={setUnit} />
      </>}

      {variant === 'metric' && <>
        <input style={inp} value={formula} onChange={e => setFormula(e.target.value)} placeholder="Formula (e.g. a * b)" />
        <UnitSelect value={unit} onChange={setUnit} />
      </>}

      {variant !== 'constant' && <>
        <select style={{ ...inp, marginBottom: 4 }} value={displayMode} onChange={e => setDisplayMode(e.target.value as 'value' | 'series')}>
          <option value="value">Current Value</option>
          <option value="series">Series</option>
        </select>
        {displayMode === 'series' && (
          <select style={{ ...inp, marginBottom: 4 }} value={chartType} onChange={e => setChartType(e.target.value as 'line' | 'area' | 'bar')}>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        )}
      </>}

      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button style={btn(true)} onClick={handleSave}>Save</button>
        <button style={btn()} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function UnitSelect({ value, onChange }: { value: Unit; onChange: (u: Unit) => void }) {
  return (
    <select style={{ ...inp, marginBottom: 4 }} value={value} onChange={e => onChange(e.target.value as Unit)}>
      <option value="number">Number</option>
      <option value="money">Money ($)</option>
      <option value="percent">Percent (%)</option>
    </select>
  )
}

// ── Single library item row ────────────────────────────────────────────────────

function LibraryItemRow({
  item,
  onDragStart,
  onAddToCanvas,
  onEdit,
  onDelete,
}: {
  item: LibraryItem
  onDragStart: (e: React.DragEvent, template: NodeTemplate) => void
  onAddToCanvas: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, item.template)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', padding: '4px 8px 4px 12px',
        gap: 2, cursor: 'grab', userSelect: 'none',
        background: hovered ? '#1c1c34' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ flex: 1, fontSize: 12, color: '#b0b0d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>

      {hovered && <>
        <button style={{ ...iconBtn, color: '#4a9fd4' }} title="Add to diagram" onClick={e => { e.stopPropagation(); onAddToCanvas() }}>+</button>
        <button style={{ ...iconBtn, color: '#8888cc' }} title="Edit"           onClick={e => { e.stopPropagation(); onEdit() }}>✎</button>
        <button style={{ ...iconBtn, color: '#c06060' }} title="Delete"         onClick={e => { e.stopPropagation(); onDelete() }}>✕</button>
      </>}
    </div>
  )
}

// ── Main drawer ───────────────────────────────────────────────────────────────

export default function Drawer({ onClose, addNode }: DrawerProps) {
  const { items, addItem, updateItem, removeItem, resetToDefaults } = useLibraryContext()
  const { screenToFlowPosition } = useReactFlow()
  const [editingId, setEditingId]    = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  // Group by entity type in fixed order
  const grouped: Record<TypeKey, LibraryItem[]> = { constant: [], measure: [], metric: [], regular: [] }
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
