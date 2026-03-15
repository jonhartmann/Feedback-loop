import { useState, useCallback } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import type { FeedbackNodeData } from '../../types/graph'
import PortEditor from './PortEditor'
import './FeedbackNode.css'

export default function FeedbackNode({ id, data, selected }: NodeProps<Node<FeedbackNodeData>>) {
  const nodeData = data as FeedbackNodeData
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(nodeData.label)
  const [showPortEditor, setShowPortEditor] = useState(false)
  const { updateNodeData } = useReactFlow()

  const commitLabel = useCallback(() => {
    const trimmed = labelDraft.trim() || 'Node'
    updateNodeData(id as string, { label: trimmed } as Partial<FeedbackNodeData>)
    setLabelDraft(trimmed)
    setIsEditingLabel(false)
  }, [id, labelDraft, updateNodeData])

  const inputs = nodeData.inputs ?? []
  const outputs = nodeData.outputs ?? []

  return (
    <div className={`feedback-node${selected ? ' selected' : ''}`}>
      {/* Input handles — left side */}
      {inputs.map((port, k) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          style={{ top: `${(100 / (inputs.length + 1)) * (k + 1)}%` }}
          title={port.label}
        />
      ))}

      {/* Output handles — right side */}
      {outputs.map((port, k) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          style={{ top: `${(100 / (outputs.length + 1)) * (k + 1)}%` }}
          title={port.label}
        />
      ))}

      <div className="node-header">
        {isEditingLabel ? (
          <input
            className="node-label-input"
            value={labelDraft}
            autoFocus
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') { setLabelDraft(nodeData.label); setIsEditingLabel(false) } }}
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
        <button
          className="edit-ports-btn"
          onClick={() => setShowPortEditor(v => !v)}
          title="Edit ports"
        >
          {showPortEditor ? 'Done' : 'Ports'}
        </button>
      </div>

      <div className="node-body">
        <div className="ports-column inputs">
          {inputs.map(port => (
            <div key={port.id} className="port-row">
              <span className="port-label">{port.label}</span>
            </div>
          ))}
          {inputs.length === 0 && <span style={{ fontSize: 11, color: '#aaa' }}>no inputs</span>}
        </div>
        <div className="ports-column outputs">
          {outputs.map(port => (
            <div key={port.id} className="port-row">
              <span className="port-label">{port.label}</span>
            </div>
          ))}
          {outputs.length === 0 && <span style={{ fontSize: 11, color: '#aaa' }}>no outputs</span>}
        </div>
      </div>

      {showPortEditor && (
        <div className="port-editor-wrapper">
          <PortEditor nodeId={id} inputs={inputs} outputs={outputs} />
        </div>
      )}
    </div>
  )
}
