import type { Node, Edge } from '@xyflow/react'
import type { FeedbackNodeData, SerializedGraph, SerializedNode, SerializedEdge, NodeVariant } from '../types/graph'

export function serializeGraph(
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
  name?: string,
): SerializedGraph {
  const serializedNodes: SerializedNode[] = nodes.map(n => ({
    id: n.id,
    position: { x: n.position.x, y: n.position.y },
    data: {
      label: n.data.label,
      ...(n.data.variant && { variant: n.data.variant }),
      inputs: n.data.inputs,
      outputs: n.data.outputs,   // OutputPort[] — may carry formula, value, and/or unit
      ...(n.data.description !== undefined && { description: n.data.description }),
      ...(n.data.variables?.length && { variables: n.data.variables }),
      ...(n.data.metricFormula !== undefined && { metricFormula: n.data.metricFormula }),
      ...(n.data.metricUnit !== undefined && { metricUnit: n.data.metricUnit }),
      ...(n.data.sourceUrl !== undefined && { sourceUrl: n.data.sourceUrl }),
      ...(n.data.displayMode !== undefined && { displayMode: n.data.displayMode }),
      ...(n.data.seriesChartType !== undefined && { seriesChartType: n.data.seriesChartType }),
      // legacy n.data.formula is intentionally not written
    },
  }))

  const serializedEdges: SerializedEdge[] = edges.map(e => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle ?? '',
    target: e.target,
    targetHandle: e.targetHandle ?? '',
  }))

  return { version: 1, ...(name ? { name } : {}), nodes: serializedNodes, edges: serializedEdges }
}

export function deserializeGraph(graph: SerializedGraph): {
  nodes: Node<FeedbackNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<FeedbackNodeData>[] = graph.nodes.map(n => ({
    id: n.id,
    type: 'feedbackNode',
    position: n.position,
    dragHandle: '.node-header',
    data: {
      label: n.data.label,
      variant: (n.data.variant ?? 'expression') as NodeVariant,
      inputs: n.data.inputs ?? [],
      outputs: n.data.outputs ?? [],   // preserves formula and value fields
      ...(n.data.description !== undefined && { description: n.data.description }),
      ...(n.data.variables !== undefined && { variables: n.data.variables }),
      ...(n.data.metricFormula !== undefined && { metricFormula: n.data.metricFormula }),
      ...(n.data.metricUnit !== undefined && { metricUnit: n.data.metricUnit }),
      ...(n.data.sourceUrl !== undefined && { sourceUrl: n.data.sourceUrl }),
      ...(n.data.displayMode !== undefined && { displayMode: n.data.displayMode }),
      ...(n.data.seriesChartType !== undefined && { seriesChartType: n.data.seriesChartType }),
      // legacy n.data.formula silently dropped
    },
  }))

  const edges: Edge[] = graph.edges.map(e => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle || null,
    target: e.target,
    targetHandle: e.targetHandle || null,
  }))

  return { nodes, edges }
}
