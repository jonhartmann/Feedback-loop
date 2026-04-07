import { createContext, useContext } from 'react'
import type { FeedbackNodeData, NodeVariant, InputPort, OutputPort, Unit } from '../../types/graph'

interface NodeContextValue {
  nodeId: string
  nodeData: FeedbackNodeData
  variant: NodeVariant
  isValueNode: boolean
  isMetric: boolean
  isSingleOutputRegular: boolean
  showExpanded: boolean
  displayMode: 'value' | 'series'
  inputs: InputPort[]
  outputs: OutputPort[]
  seriesHistory: number[]
  seriesChartType: 'line' | 'area' | 'bar'
  primaryUnit: Unit | undefined
  primaryValue: number | undefined
  portLabelField: (portId: string, portType: 'input' | 'output', currentLabel: string) => React.ReactNode
  getPortRowDragProps: (portId: string, type: 'input' | 'output') => React.HTMLAttributes<HTMLDivElement> & { className: string }
  getDragHandleProps: (portId: string, type: 'input' | 'output') => { draggable: true; onDragStart: React.DragEventHandler; onDragEnd: React.DragEventHandler }
  updateOutputValue: (portId: string, value: number) => void
  updateInputValue: (portId: string, value: number) => void
  setOutputUnit: (portId: string, unit: Unit | undefined) => void
  onMetricPortChange: (patch: { formula?: string; unit?: Unit | undefined }) => void
  addQuickInput: (e: React.MouseEvent) => void
  addQuickOutput: (e: React.MouseEvent) => void
  onSourceUrlChange: (url: string | undefined) => void
  onOutputFormulaChange: (portId: string, formula: string | undefined) => void
}

const NodeContext = createContext<NodeContextValue | null>(null)

export { NodeContext }

export function useNodeContext(): NodeContextValue {
  const ctx = useContext(NodeContext)
  if (!ctx) throw new Error('useNodeContext must be used within a NodeContext.Provider')
  return ctx
}
