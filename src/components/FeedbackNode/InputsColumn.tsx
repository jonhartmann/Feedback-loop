import { useState } from 'react'
import { Handle, Position, useConnection, useEdges, useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData } from '../../types/graph'
import { useNodeContext } from './NodeContext'

export const ADD_INPUT_HANDLE_ID = '__add_input__'

export function InputsColumn() {
  const { variant, nodeId, inputs, variables, showExpanded, portLabelField, getPortRowDragProps, getDragHandleProps } = useNodeContext()
  const { inProgress } = useConnection()
  const { updateNodeData, setEdges } = useReactFlow()
  const edges = useEdges()
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null)

  const canAddInputs = variant === 'expression' || variant === 'metric'

  function deleteInput(portId: string) {
    updateNodeData(nodeId, {
      inputs: inputs.filter(p => p.id !== portId),
    } as Partial<FeedbackNodeData>)
    setEdges(eds => eds.filter(e => !(e.target === nodeId && e.targetHandle === portId)))
  }

  return (
    <div className="ports-column inputs">
      {inputs.map(port => (
        <div
          key={port.id}
          {...getPortRowDragProps(port.id, 'input')}
          onMouseEnter={() => setHoveredPortId(port.id)}
          onMouseLeave={() => setHoveredPortId(null)}
        >
          <Handle
            id={port.id}
            type="target"
            position={Position.Left}
            title={port.label}
            isConnectableStart={edges.some(e => e.target === nodeId && e.targetHandle === port.id)}
          />
          {showExpanded && <span className="port-drag-handle" {...getDragHandleProps(port.id, 'input')}>⠿</span>}
          {showExpanded && portLabelField(port.id, 'input', port.label)}
          {showExpanded && canAddInputs && (
            <button
              className="delete-node-btn"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); deleteInput(port.id) }}
              title="Remove input"
              style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 4px', visibility: hoveredPortId === port.id ? 'visible' : 'hidden' }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {showExpanded && variables.map((v, i) => (
        <div key={i} className="port-row">
          <span className="port-label is-constant">{v.name}</span>
          <span className="port-constant-badge">= {v.value}</span>
        </div>
      ))}
      {showExpanded && inputs.length === 0 && variables.length === 0 && (
        <span style={{ fontSize: 11, color: '#aaa' }}>no inputs</span>
      )}
      {canAddInputs && (
        <div
          className="port-row"
          style={{
            height: 0,
            minHeight: 0,
            overflow: 'visible',
            marginTop: -6,
            opacity: inProgress ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
        >
          <Handle
            id={ADD_INPUT_HANDLE_ID}
            type="target"
            position={Position.Left}
            title="Drop here to add a new input"
            style={{ background: '#aaa', border: '2px dashed #888', borderRadius: '50%' }}
          />
        </div>
      )}
    </div>
  )
}
