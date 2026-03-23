import { useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData, NodeVariant } from '../../types/graph'

interface NodeHeaderProps {
  id: string
  nodeData: FeedbackNodeData
  variant: NodeVariant | undefined
  isEditingLabel: boolean
  labelDraft: string
  showExpanded: boolean
  showEditor: boolean
  displayMode: string
  variantOptions: { value: string; label: string }[]
  setLabelDraft: (v: string) => void
  setIsEditingLabel: (v: boolean) => void
  setShowEditor: (fn: (v: boolean) => boolean) => void
  commitLabel: () => void
  changeVariant: (v: NodeVariant | undefined) => void
  saveToLibrary: (e: React.MouseEvent) => void
  deleteNode: (e: React.MouseEvent) => void
}

export function NodeHeader({
  id, nodeData, variant, isEditingLabel, labelDraft, showExpanded, showEditor,
  displayMode, variantOptions, setLabelDraft, setIsEditingLabel, setShowEditor,
  commitLabel, changeVariant, saveToLibrary, deleteNode,
}: NodeHeaderProps) {
  const { updateNodeData } = useReactFlow()
  const isValueNode = variant === 'constant' || variant === 'measure'
  const isMetric = variant === 'metric'

  return (
    <div className="node-header">
      {isEditingLabel ? (
        <input
          className="node-label-input"
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
          className="node-label"
          title="Double-click to edit"
          onDoubleClick={() => { setLabelDraft(nodeData.label); setIsEditingLabel(true) }}
        >
          {nodeData.label}
        </span>
      )}

      {showExpanded && (
        <select
          className={`variant-select${variant ? ` variant-${variant}` : ''}`}
          value={variant ?? 'expression'}
          onMouseDown={e => e.stopPropagation()}
          onChange={e => changeVariant(e.target.value as NodeVariant)}
        >
          {variantOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {showExpanded && variant !== 'constant' && (
        <button
          className="display-mode-btn"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            updateNodeData(id, {
              displayMode: displayMode === 'series' ? undefined : 'series',
            } as Partial<FeedbackNodeData>)
          }}
          title={displayMode === 'series' ? 'Switch to current value' : 'Switch to series view'}
        >
          {displayMode === 'series' ? '⊟' : '∿'}
        </button>
      )}

      {showExpanded && !isValueNode && !isMetric && (
        <button
          className="edit-ports-btn"
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setShowEditor(v => !v)}
          title="Edit node details"
        >
          {showEditor ? 'Done' : 'Edit'}
        </button>
      )}

      {showExpanded && (
        <button
          className="save-library-btn"
          onMouseDown={e => e.stopPropagation()}
          onClick={saveToLibrary}
          title="Save to Library"
        >
          ☆
        </button>
      )}

      {showExpanded && (
        <button
          className="delete-node-btn"
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
