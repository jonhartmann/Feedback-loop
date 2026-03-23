import { createContext, useContext } from 'react'
import type { FeedbackNodeData, NodeVariant, Port, OutputPort, NodeVariable, Unit } from '../../types/graph'
import type { ChartType } from './SeriesModePanel'

interface NodeContextValue {
  nodeId: string
  nodeData: FeedbackNodeData
  variant: NodeVariant
  isValueNode: boolean
  isMetric: boolean
  isSingleOutputRegular: boolean
  showExpanded: boolean
  displayMode: 'value' | 'series'
  inputs: Port[]
  outputs: OutputPort[]
  variables: NodeVariable[]
  seriesHistory: number[]
  seriesChartType: ChartType
  primaryUnit: Unit | undefined
  primaryValue: number | undefined
  portLabelField: (portId: string, portType: 'input' | 'output', currentLabel: string) => React.ReactNode
  getPortRowDragProps: (portId: string, type: 'input' | 'output') => React.HTMLAttributes<HTMLDivElement> & { className: string }
  getDragHandleProps: (portId: string, type: 'input' | 'output') => { draggable: true; onDragStart: React.DragEventHandler; onDragEnd: React.DragEventHandler }
  updateOutputValue: (portId: string, value: number) => void
  cycleOutputUnit: (portId: string) => void
  cycleMetricUnit: () => void
  addQuickInput: (e: React.MouseEvent) => void
  addQuickConstant: (e: React.MouseEvent) => void
  addQuickOutput: (e: React.MouseEvent) => void
  onChartTypeChange: (t: ChartType) => void
  onSourceUrlChange: (url: string | undefined) => void
  onMetricFormulaChange: (v: string | undefined) => void
}

const NodeContext = createContext<NodeContextValue | null>(null)

export { NodeContext }

export function useNodeContext(): NodeContextValue {
  const ctx = useContext(NodeContext)
  if (!ctx) throw new Error('useNodeContext must be used within a NodeContext.Provider')
  return ctx
}
