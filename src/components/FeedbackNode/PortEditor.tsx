import { useReactFlow } from '@xyflow/react'
import type { Port, FeedbackNodeData } from '../../types/graph'

interface PortEditorProps {
  nodeId: string;
  inputs: Port[];
  outputs: Port[];
  description: string | undefined;
  formula: string | undefined;
}

export default function PortEditor({ nodeId, inputs, outputs, description, formula }: PortEditorProps) {
  const { updateNodeData, getEdges, deleteElements } = useReactFlow()

  function updateData(patch: Partial<FeedbackNodeData>) {
    updateNodeData(nodeId, patch as Partial<FeedbackNodeData>)
  }

  function updatePorts(newInputs: Port[], newOutputs: Port[]) {
    updateData({ inputs: newInputs, outputs: newOutputs })
  }

  function removePort(type: 'input' | 'output', portId: string) {
    const edges = getEdges()
    const orphaned = edges.filter(e =>
      (type === 'output' && e.source === nodeId && e.sourceHandle === portId) ||
      (type === 'input'  && e.target === nodeId && e.targetHandle === portId)
    )
    if (orphaned.length > 0) deleteElements({ edges: orphaned })

    if (type === 'input') {
      updatePorts(inputs.filter(p => p.id !== portId), outputs)
    } else {
      updatePorts(inputs, outputs.filter(p => p.id !== portId))
    }
  }

  function renamePort(type: 'input' | 'output', portId: string, label: string) {
    if (type === 'input') {
      updatePorts(inputs.map(p => p.id === portId ? { ...p, label } : p), outputs)
    } else {
      updatePorts(inputs, outputs.map(p => p.id === portId ? { ...p, label } : p))
    }
  }

  function addPort(type: 'input' | 'output') {
    const id = crypto.randomUUID()
    if (type === 'input') {
      updatePorts([...inputs, { id, label: `in${inputs.length + 1}` }], outputs)
    } else {
      updatePorts(inputs, [...outputs, { id, label: `out${outputs.length + 1}` }])
    }
  }

  return (
    <div style={{ fontSize: 12 }}>
      {/* Description */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#444' }}>Description</div>
        <textarea
          value={description ?? ''}
          onChange={e => updateData({ description: e.target.value || undefined })}
          placeholder="Optional description of this node…"
          rows={3}
          style={{
            width: '100%',
            fontSize: 11,
            padding: '4px 6px',
            border: '1px solid #ccc',
            borderRadius: 3,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onMouseDown={e => e.stopPropagation()}
        />
      </div>

      {/* Formula */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#444' }}>Formula</div>
        <textarea
          value={formula ?? ''}
          onChange={e => updateData({ formula: e.target.value || undefined })}
          placeholder="e.g. output = input_a * 0.8 + input_b"
          rows={3}
          style={{
            width: '100%',
            fontSize: 11,
            padding: '4px 6px',
            border: '1px solid #ccc',
            borderRadius: 3,
            resize: 'vertical',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
          onMouseDown={e => e.stopPropagation()}
        />
      </div>

      <PortSection
        title="Inputs"
        ports={inputs}
        type="input"
        onAdd={() => addPort('input')}
        onRemove={(id) => removePort('input', id)}
        onRename={(id, label) => renamePort('input', id, label)}
      />
      <PortSection
        title="Outputs"
        ports={outputs}
        type="output"
        onAdd={() => addPort('output')}
        onRemove={(id) => removePort('output', id)}
        onRename={(id, label) => renamePort('output', id, label)}
      />
    </div>
  )
}

interface PortSectionProps {
  title: string;
  ports: Port[];
  type: 'input' | 'output';
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, label: string) => void;
}

function PortSection({ title, ports, onAdd, onRemove, onRename }: PortSectionProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#444' }}>{title}</div>
      {ports.map(port => (
        <div key={port.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <input
            value={port.label}
            onChange={e => onRename(port.id, e.target.value)}
            style={{ flex: 1, fontSize: 11, padding: '1px 4px', border: '1px solid #ccc', borderRadius: 3 }}
            onMouseDown={e => e.stopPropagation()}
          />
          <button
            onClick={() => onRemove(port.id)}
            title="Remove port"
            style={{ fontSize: 10, padding: '1px 5px', border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer', background: '#fff', color: '#c00' }}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        style={{ fontSize: 11, padding: '2px 8px', border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer', background: '#fff', marginTop: 2 }}
      >
        + Add
      </button>
    </div>
  )
}
