import { useCallback, useState } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import type { Node, Edge, XYPosition } from '@xyflow/react'
import type { FeedbackNodeData, NodeVariant, SerializedGraph, NodeTemplate, InputPort, OutputPort } from '../types/graph'
import { METRIC_PORT_ID } from '../types/graph'
import { serializeGraph, deserializeGraph } from '../utils/serialization'
import { findFreePosition } from '../utils/placement'
import { toCamelCase, labelToVarName } from '../utils/formulaEval'

export function useGraphState() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FeedbackNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [docName, setDocName] = useState('')

  const addNode = useCallback((position: XYPosition, variantOrTemplate?: NodeVariant | NodeTemplate) => {
    const isTemplate = !!variantOrTemplate && typeof variantOrTemplate === 'object'
    const template = isTemplate ? variantOrTemplate as NodeTemplate : undefined
    const variant: NodeVariant = (isTemplate ? template!.variant : variantOrTemplate as NodeVariant | undefined) ?? 'expression'

    const defaultLabel = template?.label
      ?? (variant === 'constant' ? 'Constant'
        : variant === 'measure' ? 'Measure'
        : variant === 'metric'  ? 'Metric'
        : 'Expression')

    setNodes(nds => {
      const freePos = findFreePosition(position, nds)
      const newId = () => crypto.randomUUID()

      let inputs: InputPort[]
      let outputs: OutputPort[]

      if (template?.inputs?.length) {
        // Full port spec saved from a live node — regenerate IDs to avoid conflicts
        inputs = template.inputs.map(p => ({ ...p, id: newId() }))
        outputs = template.outputs?.length
          ? template.outputs.map(p => ({ ...p, id: newId() }))
          : []
      } else if (variant === 'constant') {
        inputs = []
        outputs = [{ id: newId(), label: toCamelCase(defaultLabel) || 'value', value: template?.value ?? 0 }]
      } else if (variant === 'measure') {
        const portLabel = toCamelCase(defaultLabel) || 'value'
        inputs = [{ id: newId(), label: portLabel }]
        outputs = [{ id: newId(), label: portLabel, formula: labelToVarName(portLabel) }]
      } else if (variant === 'metric') {
        inputs = [{ id: newId(), label: 'in' }]
        outputs = [{ id: METRIC_PORT_ID, label: 'value' }]
      } else {
        // expression
        inputs = [{ id: newId(), label: 'in' }]
        outputs = [{ id: newId(), label: 'out1' }]
      }

      const newNode: Node<FeedbackNodeData> = {
        id: newId(),
        type: 'feedbackNode',
        position: freePos,
        dragHandle: '.feedback-node__header',
        data: {
          label: defaultLabel,
          variant,
          inputs,
          outputs,
          ...(template?.displayMode     ? { displayMode: template.displayMode }
            : variant === 'measure'    ? { displayMode: 'series' as const }             : {}),
          ...(template?.seriesChartType ? { seriesChartType: template.seriesChartType }
            : variant === 'measure'    ? { seriesChartType: 'area' as const }            : {}),
        },
      }
      return [...nds, newNode]
    })
  }, [setNodes])

  const getSerializedGraph = useCallback((): SerializedGraph => {
    return serializeGraph(nodes, edges, docName || undefined)
  }, [nodes, edges, docName])

  const loadGraph = useCallback((graph: SerializedGraph) => {
    const { nodes: newNodes, edges: newEdges } = deserializeGraph(graph)
    setNodes(newNodes)
    setEdges(newEdges)
    setDocName(graph.name ?? '')
  }, [setNodes, setEdges])

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setEdges,
    setNodes,
    addNode,
    getSerializedGraph,
    loadGraph,
    docName,
    setDocName,
  }
}
