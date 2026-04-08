import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData, OutputPort } from '../../types/graph'
import { METRIC_PORT_ID } from '../../types/graph'
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

  const updateInputValue = useCallback((portId: string, rawVal: number) => {
    const value = isFinite(rawVal) ? rawVal : 0
    updateNodeData(id, {
      inputs: inputs.map(p => p.id === portId ? { ...p, value } : p),
    } as Partial<FeedbackNodeData>)
  }, [id, inputs, updateNodeData])

  const setOutputUnit = useCallback((portId: string, unit: Unit | undefined) => {
    const port = outputs.find(p => p.id === portId)
    if (!port) return

    const oldUnit = port.unit
    const toPercent   = unit === 'percent' && oldUnit !== 'percent'
    const fromPercent = oldUnit === 'percent' && unit !== 'percent'

    const updatedOutputs = outputs.map(p => {
      if (p.id !== portId) return p
      if (toPercent   && isFinite(p.value ?? NaN)) return { ...p, unit, value: (p.value ?? 0) / 100 }
      if (fromPercent && isFinite(p.value ?? NaN)) return { ...p, unit, value: (p.value ?? 0) * 100 }
      return { ...p, unit }
    })

    const update: Partial<FeedbackNodeData> = { outputs: updatedOutputs }

    // Measure nodes store the editable value on inputs[0], not on the output port
    if (variant === 'measure' && (toPercent || fromPercent)) {
      const src = inputs[0]
      if (src) {
        const current = src.value ?? 0
        const newVal  = toPercent ? current / 100 : current * 100
        update.inputs = inputs.map((p, i) => i === 0 ? { ...p, value: newVal } : p)
      }
    }

    updateNodeData(id, update as Partial<FeedbackNodeData>)
  }, [id, variant, inputs, outputs, updateNodeData])

  /** Update formula and/or unit on the metric output port (METRIC_PORT_ID). */
  const onMetricPortChange = useCallback((patch: { formula?: string; unit?: Unit | undefined }) => {
    updateNodeData(id, {
      outputs: outputs.map(p =>
        p.id === METRIC_PORT_ID ? { ...p, ...patch } : p
      ),
    } as Partial<FeedbackNodeData>)
  }, [id, outputs, updateNodeData])

  const addQuickInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, {
      inputs: [...inputs, { id: crypto.randomUUID(), label: `in${inputs.length + 1}` }],
    } as Partial<FeedbackNodeData>)
  }, [id, inputs, updateNodeData])

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

  const onSourceUrlChange = useCallback((url: string | undefined) => {
    updateNodeData(id, {
      inputs: inputs.map((p, i) => i === 0 ? { ...p, sourceUrl: url } : p),
    } as Partial<FeedbackNodeData>)
  }, [id, inputs, updateNodeData])

  return {
    commitLabel,
    deleteNode,
    saveToLibrary,
    updateOutputValue,
    updateInputValue,
    setOutputUnit,
    onMetricPortChange,
    addQuickInput,
    addQuickOutput,
    onSourceUrlChange,
  }
}
