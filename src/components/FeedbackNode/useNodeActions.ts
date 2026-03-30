import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData, OutputPort } from '../../types/graph'
import { toCamelCase } from '../../utils/formulaEval'
import { nodeDataToTemplate } from '../../utils/nodeTemplate'
import { useLibraryContext } from '../../context/LibraryContext'

const UNITS = ['number', 'money', 'percent'] as const
type Unit = typeof UNITS[number]

interface NodeActionProps {
  id: string
  nodeData: FeedbackNodeData
}

export function useNodeActions({ id, nodeData }: NodeActionProps) {
  const { updateNodeData, deleteElements } = useReactFlow()
  const { addItem } = useLibraryContext()

  const variant = nodeData.variant
  const isValueNode = variant === 'constant' || variant === 'measure'
  const inputs = nodeData.inputs ?? []
  const outputs = nodeData.outputs ?? []
  const variables = nodeData.variables ?? []

  const commitLabel = useCallback((labelDraft: string, onDone: (trimmed: string) => void) => {
    const trimmed = labelDraft.trim() || 'Node'
    const oldLabel = nodeData.label
    const update: Partial<FeedbackNodeData> = { label: trimmed }
    if (isValueNode) {
      const oldCamel = toCamelCase(oldLabel)
      const newCamel = toCamelCase(trimmed)
      if (oldCamel !== newCamel) {
        update.outputs = outputs.map(p =>
          (p.label === 'value' || p.label === oldCamel) ? { ...p, label: newCamel } : p
        )
      }
    }
    updateNodeData(id, update)
    onDone(trimmed)
  }, [id, nodeData.label, outputs, isValueNode, updateNodeData])

  const deleteNode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }, [id, deleteElements])

  const saveToLibrary = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({ label: nodeData.label, category: 'Custom', template: nodeDataToTemplate(nodeData) })
  }, [addItem, nodeData])

  const updateOutputValue = useCallback((portId: string, rawVal: number) => {
    const value = isFinite(rawVal) ? rawVal : 0
    updateNodeData(id, {
      outputs: outputs.map(p => p.id === portId ? { ...p, value } : p),
    } as Partial<FeedbackNodeData>)
  }, [id, outputs, updateNodeData])

  const setOutputUnit = useCallback((portId: string, unit: Unit | undefined) => {
    updateNodeData(id, {
      outputs: outputs.map(p => p.id === portId ? { ...p, unit } : p),
    } as Partial<FeedbackNodeData>)
  }, [id, outputs, updateNodeData])

  const setMetricUnit = useCallback((unit: Unit | undefined) => {
    updateNodeData(id, { metricUnit: unit } as Partial<FeedbackNodeData>)
  }, [id, updateNodeData])

  const addQuickInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, {
      inputs: [...inputs, { id: crypto.randomUUID(), label: `in${inputs.length + 1}` }],
    } as Partial<FeedbackNodeData>)
  }, [id, inputs, updateNodeData])

  const addQuickConstant = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, {
      variables: [...variables, { name: `k${variables.length + 1}`, value: 0 }],
    } as Partial<FeedbackNodeData>)
  }, [id, variables, updateNodeData])

  const addQuickOutput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const baseName = toCamelCase(nodeData.label) || 'output'
    const taken = new Set(outputs.map(p => p.label))
    let label = baseName
    if (taken.has(label)) {
      let n = 2
      while (taken.has(`${baseName}${n}`)) n++
      label = `${baseName}${n}`
    }
    const newPort: OutputPort = isValueNode
      ? { id: crypto.randomUUID(), label, value: 0 }
      : { id: crypto.randomUUID(), label }
    updateNodeData(id, {
      outputs: [...outputs, newPort],
    } as Partial<FeedbackNodeData>)
  }, [id, outputs, isValueNode, nodeData.label, updateNodeData])

  return {
    commitLabel,
    deleteNode,
    saveToLibrary,
    updateOutputValue,
    setOutputUnit,
    setMetricUnit,
    addQuickInput,
    addQuickConstant,
    addQuickOutput,
  }
}
