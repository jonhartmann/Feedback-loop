import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  SelectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react'
import FeedbackNode from './FeedbackNode/FeedbackNode'
import DeletableEdge from './DeletableEdge'
import type { FeedbackNodeData, NodeTemplate, NodeVariant } from '../types/graph'
import { useCanvasConnections } from './useCanvasConnections'
import { useDragToLibrary } from './useDragToLibrary'

interface FlowCanvasProps {
  nodes: Node<FeedbackNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<FeedbackNodeData>>;
  onEdgesChange: OnEdgesChange;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  setNodes: (updater: (nodes: Node<FeedbackNodeData>[]) => Node<FeedbackNodeData>[]) => void;
  addNode: (position: { x: number; y: number }, variantOrTemplate?: NodeVariant | NodeTemplate) => void;
  drawerOpen?: boolean;
  drawerWidth?: number;
  onSaveNodeToLibrary?: (data: FeedbackNodeData) => void;
}

export default function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, setEdges, setNodes, addNode, drawerOpen, drawerWidth = 260, onSaveNodeToLibrary }: FlowCanvasProps) {
  const nodeTypes = useMemo(() => ({ feedbackNode: FeedbackNode }), [])
  const edgeTypes = useMemo(() => ({ default: DeletableEdge }), [])

  const { onConnect, onConnectEnd, onReconnect, onReconnectStart, onReconnectEnd } =
    useCanvasConnections({ setEdges, setNodes })

  const { onNodeDragStart, onNodeDragStop, handleDrop } =
    useDragToLibrary({ setNodes, addNode, drawerOpen, drawerWidth, onSaveNodeToLibrary })

  return (
    <div
      data-tour="canvas"
      style={{ width: '100%', height: '100%' }}
      onContextMenu={e => e.preventDefault()}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onPaneClick={() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        }}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        edgesReconnectable
        panOnDrag={[1, 2]}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        deleteKeyCode="Delete"
      >
        <Background gap={20} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
