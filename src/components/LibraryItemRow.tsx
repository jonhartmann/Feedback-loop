import type { LibraryItem, NodeTemplate } from '../types/graph'
import './LibraryItem.css'

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
  return (
    <div
      className="library-item"
      draggable
      onDragStart={e => onDragStart(e, item.template)}
    >
      <span className="library-item__label">{item.label}</span>

      <div className="library-item__actions">
        <button className="library-item__btn" title="Add to diagram" onClick={e => { e.stopPropagation(); onAddToCanvas() }}>+</button>
        <button className="library-item__btn" title="Edit"           onClick={e => { e.stopPropagation(); onEdit() }}>✎</button>
        <button className="library-item__btn library-item__btn--delete" title="Delete" onClick={e => { e.stopPropagation(); onDelete() }}>✕</button>
      </div>
    </div>
  )
}
