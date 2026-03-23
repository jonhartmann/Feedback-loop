import { useState, useCallback } from 'react'
import type { FeedbackNodeData, Port, OutputPort } from '../../types/graph'
import { labelToVarName } from '../../utils/formulaEval'

export function usePortEditing({
  nodeId,
  inputs,
  outputs,
  metricFormula,
  updateNodeData,
}: {
  nodeId: string
  inputs: Port[]
  outputs: OutputPort[]
  metricFormula: string | undefined
  updateNodeData: (id: string, data: Partial<FeedbackNodeData>) => void
}) {
  const [editingPortId, setEditingPortId] = useState<string | null>(null)
  const [portLabelDraft, setPortLabelDraft] = useState('')

  const startPortEdit = useCallback((portId: string, currentLabel: string) => {
    setPortLabelDraft(currentLabel)
    setEditingPortId(portId)
  }, [])

  const cancelPortEdit = useCallback(() => setEditingPortId(null), [])

  const commitPortLabel = useCallback((portId: string, portType: 'input' | 'output') => {
    const trimmed = portLabelDraft.trim()
    if (trimmed) {
      if (portType === 'input') {
        const oldPort = inputs.find(p => p.id === portId)
        const oldVar = labelToVarName(oldPort?.label ?? '')
        const newVar = labelToVarName(trimmed)
        const updatedInputs = inputs.map(p => p.id === portId ? { ...p, label: trimmed } : p)
        const update: Partial<FeedbackNodeData> = { inputs: updatedInputs }
        if (oldVar && oldVar !== newVar) {
          const re = new RegExp(`\\b${oldVar}\\b`, 'g')
          update.outputs = outputs.map(p =>
            p.formula ? { ...p, formula: p.formula.replace(re, newVar) } : p
          )
          if (metricFormula) {
            update.metricFormula = metricFormula.replace(re, newVar)
          }
        }
        updateNodeData(nodeId, update)
      } else {
        updateNodeData(nodeId, {
          outputs: outputs.map(p => p.id === portId ? { ...p, label: trimmed } : p),
        } as Partial<FeedbackNodeData>)
      }
    }
    setEditingPortId(null)
  }, [nodeId, portLabelDraft, inputs, outputs, metricFormula, updateNodeData])

  const portLabelField = (portId: string, portType: 'input' | 'output', currentLabel: string) =>
    editingPortId === portId ? (
      <input
        className="port-label-input"
        value={portLabelDraft}
        autoFocus
        onChange={e => setPortLabelDraft(e.target.value)}
        onBlur={() => commitPortLabel(portId, portType)}
        onKeyDown={e => {
          if (e.key === 'Enter') commitPortLabel(portId, portType)
          if (e.key === 'Escape') cancelPortEdit()
        }}
        onMouseDown={e => e.stopPropagation()}
      />
    ) : (
      <span
        className="port-label"
        title="Double-click to rename"
        onDoubleClick={() => startPortEdit(portId, currentLabel)}
      >
        {currentLabel}
      </span>
    )

  return { editingPortId, portLabelField }
}
