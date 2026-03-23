import { Handle, Position } from '@xyflow/react'
import { useNodeContext } from './NodeContext'

export function InputsColumn() {
  const { inputs, variables, showExpanded, portLabelField, getPortRowDragProps, getDragHandleProps, addQuickInput, addQuickConstant } = useNodeContext()

  return (
    <div className="ports-column inputs">
      {inputs.map(port => (
        <div key={port.id} {...getPortRowDragProps(port.id, 'input')}>
          <Handle id={port.id} type="target" position={Position.Left} title={port.label} />
          {showExpanded && <span className="port-drag-handle" {...getDragHandleProps(port.id, 'input')}>⠿</span>}
          {showExpanded && portLabelField(port.id, 'input', port.label)}
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
      {showExpanded && (
        <div className="quick-add-row">
          <button className="port-quick-add-btn" onMouseDown={e => e.stopPropagation()} onClick={addQuickInput} title="Add input">+ in</button>
          <button className="port-quick-add-btn is-constant" onMouseDown={e => e.stopPropagation()} onClick={addQuickConstant} title="Add constant">+ const</button>
        </div>
      )}
    </div>
  )
}
