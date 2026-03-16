import type { Node, Edge } from '@xyflow/react'
import type { FeedbackNodeData, SerializedGraph, SerializedNode, SerializedEdge } from '../types/graph'

export function serializeGraph(
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[]
): SerializedGraph {
  const serializedNodes: SerializedNode[] = nodes.map(n => ({
    id: n.id,
    position: { x: n.position.x, y: n.position.y },
    data: {
      label: n.data.label,
      inputs: n.data.inputs,
      outputs: n.data.outputs,   // OutputPort[] — each may carry formula
      ...(n.data.description !== undefined && { description: n.data.description }),
      ...(n.data.variables?.length && { variables: n.data.variables }),
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

  return { version: 1, nodes: serializedNodes, edges: serializedEdges }
}

export function deserializeGraph(graph: SerializedGraph): {
  nodes: Node<FeedbackNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<FeedbackNodeData>[] = graph.nodes.map(n => ({
    id: n.id,
    type: 'feedbackNode',
    position: n.position,
    data: {
      label: n.data.label,
      inputs: n.data.inputs ?? [],
      outputs: n.data.outputs ?? [],   // old Port[] satisfies OutputPort[] (formula is optional)
      ...(n.data.description !== undefined && { description: n.data.description }),
      ...(n.data.variables !== undefined && { variables: n.data.variables }),
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
