import { useCallback, useState } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import type { Node, Edge, XYPosition } from '@xyflow/react'
import type { FeedbackNodeData, NodeVariant, SerializedGraph, NodeTemplate, Port, OutputPort } from '../types/graph'
import { serializeGraph, deserializeGraph } from '../utils/serialization'
import { findFreePosition } from '../utils/placement'

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
      const isValue = variant === 'constant' || variant === 'measure'

      // If template has full port spec (saved from a live node), regenerate IDs to avoid conflicts
      const inputs: Port[] = template?.inputs?.length
        ? template.inputs.map(p => ({ ...p, id: newId() }))
        : (isValue ? [] : [{ id: newId(), label: 'in' }])

      const outputs: OutputPort[] = template?.outputs?.length
        ? (template.outputs.map(p => ({ ...p, id: newId() })) as OutputPort[])
        : (isValue
            ? [{ id: newId(), label: 'value', value: template?.value ?? 0, ...(template?.unit ? { unit: template.unit } : {}) }]
            : [{ id: newId(), label: 'out1' }])

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
          variables: template?.variables ?? [],
          ...(template?.metricFormula ? { metricFormula: template.metricFormula } : {}),
          ...(template?.metricUnit    ? { metricUnit: template.metricUnit }        : {}),
          ...(template?.sourceUrl     ? { sourceUrl: template.sourceUrl }          : {}),
          ...(template?.description   ? { description: template.description }      : {}),
          ...(template?.displayMode     ? { displayMode: template.displayMode }         : {}),
          ...(template?.seriesChartType ? { seriesChartType: template.seriesChartType } : {}),
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
