import { DisplayModeDropdown } from './DisplayModeDropdown'

interface NodeHeaderProps {
  nodeData: { label: string }
  isEditingLabel: boolean
  labelDraft: string
  showExpanded: boolean
  setLabelDraft: (v: string) => void
  setIsEditingLabel: (v: boolean) => void
  commitLabel: () => void
  saveToLibrary: (e: React.MouseEvent) => void
  deleteNode: (e: React.MouseEvent) => void
}

export function NodeHeader({
  nodeData, isEditingLabel, labelDraft, showExpanded,
  setLabelDraft, setIsEditingLabel,
  commitLabel, saveToLibrary, deleteNode,
}: NodeHeaderProps) {

  return (
    <div className="feedback-node__header">
      {isEditingLabel ? (
        <input
          className="feedback-node__label-input"
          value={labelDraft}
          autoFocus
          onChange={e => setLabelDraft(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={e => {
            if (e.key === 'Enter') commitLabel()
            if (e.key === 'Escape') { setLabelDraft(nodeData.label); setIsEditingLabel(false) }
          }}
          onMouseDown={e => e.stopPropagation()}
        />
      ) : (
        <span
          className="feedback-node__label"
          title="Double-click to edit"
          onDoubleClick={() => { setLabelDraft(nodeData.label); setIsEditingLabel(true) }}
        >
          {nodeData.label}
        </span>
      )}

      {showExpanded && <DisplayModeDropdown />}

      {showExpanded && (
        <button
          className="feedback-node__save-btn"
          onMouseDown={e => e.stopPropagation()}
          onClick={saveToLibrary}
          title="Save to Library"
        >
          ☆
        </button>
      )}

      {showExpanded && (
        <button
          className="feedback-node__delete-btn"
          onMouseDown={e => e.stopPropagation()}
          onClick={deleteNode}
          title="Delete node"
        >
          ✕
        </button>
      )}
    </div>
  )
}
