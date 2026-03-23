import { useState } from 'react'
import type { LibraryItem, NodeTemplate } from '../types/graph'
import { iconBtn } from './DrawerStyles'

export function LibraryItemRow({
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
