import { useReactFlow } from '@xyflow/react'
import type { InputPort, OutputPort, FeedbackNodeData } from '../../types/graph'
import { labelToVarName, FORMULA_BUILTINS } from '../../utils/formulaEval'
import FormulaInput from './FormulaInput'

interface PortEditorProps {
  nodeId: string;
  inputs: InputPort[];
  outputs: OutputPort[];
}

export default function PortEditor({ nodeId, inputs, outputs }: PortEditorProps) {
  const { updateNodeData, getEdges, deleteElements } = useReactFlow()

  function updateData(patch: Partial<FeedbackNodeData>) {
    updateNodeData(nodeId, patch as Partial<FeedbackNodeData>)
  }

  // ── Inputs / Outputs ───────────────────────────────────────────────────────

  function removePort(type: 'input' | 'output', portId: string) {
    const edges = getEdges()
    const orphaned = edges.filter(e =>
      (type === 'output' && e.source === nodeId && e.sourceHandle === portId) ||
      (type === 'input'  && e.target === nodeId && e.targetHandle === portId)
    )
    if (orphaned.length > 0) deleteElements({ edges: orphaned })

    if (type === 'input') {
      updateData({ inputs: inputs.filter(p => p.id !== portId) })
    } else {
      updateData({ outputs: outputs.filter(p => p.id !== portId) })
    }
  }

  function renamePort(type: 'input' | 'output', portId: string, label: string) {
    if (type === 'input') {
      updateData({ inputs: inputs.map(p => p.id === portId ? { ...p, label } : p) })
    } else {
      updateData({ outputs: outputs.map(p => p.id === portId ? { ...p, label } : p) })
    }
  }

  function updateOutputFormula(portId: string, formula: string) {
    updateData({
      outputs: outputs.map(p =>
        p.id === portId ? { ...p, formula: formula || undefined } : p
      )
    })
  }

  function addPort(type: 'input' | 'output') {
    const id = crypto.randomUUID()
    if (type === 'input') {
      updateData({ inputs: [...inputs, { id, label: `in${inputs.length + 1}` }] })
    } else {
      updateData({ outputs: [...outputs, { id, label: `out${outputs.length + 1}` }] })
    }
  }

  // Available variable names to hint in formula inputs
  const availableVars = inputs.map(p => labelToVarName(p.label)).filter(Boolean)
  const hintText = availableVars.length > 0 ? `Vars: ${availableVars.join(', ')}` : 'No inputs defined yet'

  return (
    <div className="port-editor">

      {/* Inputs */}
      <PortSection
        title="Inputs"
        ports={inputs}
        onAdd={() => addPort('input')}
        onRemove={(id) => removePort('input', id)}
        onRename={(id, label) => renamePort('input', id, label)}
      />

      {/* Outputs — with per-port formula */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#263640' }}>Outputs</div>
        {outputs.map(port => (
          <div key={port.id} style={{ marginBottom: 6, border: '1px solid #D7DCE3', borderRadius: 4, padding: '4px 6px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                value={port.label}
                onChange={e => renamePort('output', port.id, e.target.value)}
                style={{ flex: 1, fontSize: 11, padding: '1px 4px', border: '1px solid #CCD7DC', borderRadius: 3 }}
                onMouseDown={e => e.stopPropagation()}
              />
              <button
                onClick={() => removePort('output', port.id)}
                style={{ fontSize: 10, padding: '1px 5px', border: '1px solid #CCD7DC', borderRadius: 3, cursor: 'pointer', background: '#fff', color: '#C0350A' }}
              >✕</button>
            </div>
            <div className="port-editor__formula-row">
              <span style={{ fontSize: 11, color: '#65768C', fontFamily: "'Fira Mono', monospace", flexShrink: 0 }}>=</span>
              <FormulaInput
                value={port.formula ?? ''}
                onChange={v => updateOutputFormula(port.id, v)}
                variables={availableVars}
                builtins={FORMULA_BUILTINS}
                placeholder={`e.g. ${inputs[0] ? labelToVarName(inputs[0].label) : 'a'} / ${inputs[1] ? labelToVarName(inputs[1].label) : 'b'} * 5`}
                wrapperStyle={{ flex: 1 }}
                inputStyle={{ fontSize: 11, padding: '1px 4px', border: '1px solid #CCD7DC', borderRadius: 3, fontFamily: "'Fira Mono', monospace" }}
                onMouseDown={e => e.stopPropagation()}
              />
            </div>
            <div className="port-editor__formula-hint">{hintText}</div>
          </div>
        ))}
        <button
          onClick={() => addPort('output')}
          style={{ fontSize: 11, padding: '2px 8px', border: '1px solid #CCD7DC', borderRadius: 3, cursor: 'pointer', background: '#fff', marginTop: 2 }}
        >
          + Add
        </button>
      </div>

    </div>
  )
}

// Simple port section for inputs only
interface PortSectionProps {
  title: string;
  ports: InputPort[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, label: string) => void;
}

function PortSection({ title, ports, onAdd, onRemove, onRename }: PortSectionProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#263640' }}>{title}</div>
      {ports.map(port => (
        <div key={port.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <input
            value={port.label}
            onChange={e => onRename(port.id, e.target.value)}
            style={{ flex: 1, fontSize: 11, padding: '1px 4px', border: '1px solid #CCD7DC', borderRadius: 3 }}
            onMouseDown={e => e.stopPropagation()}
          />
          <button
            onClick={() => onRemove(port.id)}
            style={{ fontSize: 10, padding: '1px 5px', border: '1px solid #CCD7DC', borderRadius: 3, cursor: 'pointer', background: '#fff', color: '#C0350A' }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={onAdd}
        style={{ fontSize: 11, padding: '2px 8px', border: '1px solid #CCD7DC', borderRadius: 3, cursor: 'pointer', background: '#fff', marginTop: 2 }}
      >
        + Add
      </button>
    </div>
  )
}
