import { useCallback } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import type { Node, Edge, XYPosition } from '@xyflow/react'
import type { FeedbackNodeData, SerializedGraph } from '../types/graph'
import { serializeGraph, deserializeGraph } from '../utils/serialization'

export function useGraphState() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FeedbackNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const addNode = useCallback((position: XYPosition) => {
    const newNode: Node<FeedbackNodeData> = {
      id: crypto.randomUUID(),
      type: 'feedbackNode',
      position,
      data: {
        label: 'New Node',
        inputs: [],
        outputs: [],
      },
    }
    setNodes(nds => [...nds, newNode])
  }, [setNodes])

  const getSerializedGraph = useCallback((): SerializedGraph => {
    return serializeGraph(nodes, edges)
  }, [nodes, edges])

  const loadGraph = useCallback((graph: SerializedGraph) => {
    const { nodes: newNodes, edges: newEdges } = deserializeGraph(graph)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [setNodes, setEdges])

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setEdges,
    addNode,
    getSerializedGraph,
    loadGraph,
  }
}
