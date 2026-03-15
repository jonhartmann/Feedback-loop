import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from '@xyflow/react'
import FeedbackNode from './FeedbackNode/FeedbackNode'
import type { FeedbackNodeData } from '../types/graph'

interface FlowCanvasProps {
  nodes: Node<FeedbackNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<FeedbackNodeData>>;
  onEdgesChange: OnEdgesChange;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
}

export default function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, setEdges }: FlowCanvasProps) {
  const nodeTypes = useMemo(() => ({ feedbackNode: FeedbackNode }), [])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge({ ...connection, id: crypto.randomUUID() }, eds))
    },
    [setEdges]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      deleteKeyCode="Delete"
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
