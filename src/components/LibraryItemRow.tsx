import type { LibraryItem, NodeTemplate, NodeVariant } from '../types/graph'
import './LibraryItem.css'

export function LibraryItemRow({
  item,
  variant,
  onDragStart,
  onAddToCanvas,
  onDelete,
}: {
  item: LibraryItem
  variant: NodeVariant
  onDragStart: (e: React.DragEvent, template: NodeTemplate) => void
  onAddToCanvas: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="library-item"
      data-variant={variant}
      draggable
      onDragStart={e => onDragStart(e, item.template)}
      onClick={onAddToCanvas}
    >
      <span className="library-item__label">{item.label}</span>

      <div className="library-item__actions">
        <button className="library-item__btn library-item__btn--delete" title="Delete" onClick={e => { e.stopPropagation(); onDelete() }}>✕</button>
      </div>
    </div>
  )
}
