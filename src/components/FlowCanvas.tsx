import { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
  SelectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from '@xyflow/react'
import FeedbackNode from './FeedbackNode/FeedbackNode'
import DeletableEdge from './DeletableEdge'
import type { FeedbackNodeData, Port, OutputPort, NodeTemplate, NodeVariant } from '../types/graph'
import { findFreePosition } from '../utils/placement'

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
  // Override 'default' so all edges (including loaded ones) get the delete button
  const edgeTypes = useMemo(() => ({ default: DeletableEdge }), [])

  const { screenToFlowPosition, getNode, updateNodeData } = useReactFlow()

  // Track whether a reconnect drag is in progress so onConnectEnd doesn't
  // mistake a reconnect-abandon for a "create new node/port" gesture.
  const isReconnecting = useRef(false)

  // Drag-to-library: remember where a node started so we can snap it back
  const nodeDragOrigin = useRef<{ id: string; position: { x: number; y: number } } | null>(null)

  const onReconnectStart = useCallback(() => {
    isReconnecting.current = true
  }, [])

  const onReconnectEnd = useCallback(() => {
    // Defer so onConnectEnd (which fires at the same time) sees the flag first
    setTimeout(() => { isReconnecting.current = false }, 0)
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge({ ...connection, id: crypto.randomUUID() }, eds))
    },
    [setEdges]
  )

  // Replace old edge endpoints when user drags an edge end to a new handle
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges(eds =>
        eds.map(e =>
          e.id === oldEdge.id
            ? {
                ...oldEdge,
                source: newConnection.source,
                sourceHandle: newConnection.sourceHandle,
                target: newConnection.target,
                targetHandle: newConnection.targetHandle,
              }
            : e
        )
      )
    },
    [setEdges]
  )

  // When a connection drag ends without a valid target handle:
  // – If over another node's body → create a matching port on that node and connect
  // – If over empty space → create a new node with the matching port and connect
  const onConnectEnd = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      // Already connected via onConnect — nothing to do
      if (connectionState.isValid) return
      // Reconnect drag abandoned — don't create nodes/ports
      if (isReconnecting.current) return

      const { fromNode, fromHandle } = connectionState
      if (!fromNode || !fromHandle || !fromHandle.id) return

      // source handle = output port; target handle = input port
      const isFromOutput = fromHandle.type === 'source'

      // Look up the source port's label to inherit it on the new port
      const fromData = fromNode.data as FeedbackNodeData
      const sourcePort = isFromOutput
        ? fromData.outputs?.find((p: Port) => p.id === fromHandle.id)
        : fromData.inputs?.find((p: Port) => p.id === fromHandle.id)
      const sourceLabel = sourcePort?.label ?? ''

      // If the source label is a generic default (e.g. "out2", "in1"), don't
      // propagate it — let the receiving side pick its own sequential default.
      const isDefaultLabel = isFromOutput
        ? /^out\d+$/.test(sourceLabel)
        : /^in\d+$/.test(sourceLabel)

      // Build the label for the auto-created receiving port
      const receivingLabel = (fallback: string) =>
        (!isDefaultLabel && sourceLabel) ? sourceLabel : fallback

      const mouseEvent = event as MouseEvent

      // Find the topmost DOM element at the drop position
      const element = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY)

      // If dropped onto an existing (but incompatible) handle, do nothing
      if (element?.closest('.react-flow__handle')) return

      // Check if dropped on a node body
      const nodeEl = element?.closest('.react-flow__node')
      const targetNodeId = nodeEl?.getAttribute('data-id') ?? null

      if (targetNodeId && targetNodeId !== fromNode.id) {
        // ── Dropped on another node's body ──
        const targetNode = getNode(targetNodeId)
        if (!targetNode) return
        const targetData = targetNode.data as FeedbackNodeData
        const portId = crypto.randomUUID()

        if (isFromOutput) {
          const fallback = `in${(targetData.inputs?.length ?? 0) + 1}`
          const newPort: Port = { id: portId, label: receivingLabel(fallback) }
          updateNodeData(targetNodeId, {
            inputs: [...(targetData.inputs ?? []), newPort],
          } as Partial<FeedbackNodeData>)
          setEdges(eds =>
            addEdge(
              { source: fromNode.id, sourceHandle: fromHandle.id, target: targetNodeId, targetHandle: portId, id: crypto.randomUUID() },
              eds
            )
          )
        } else {
          const fallback = `out${(targetData.outputs?.length ?? 0) + 1}`
          const newPort: OutputPort = { id: portId, label: receivingLabel(fallback) }
          updateNodeData(targetNodeId, {
            outputs: [...(targetData.outputs ?? []), newPort],
          } as Partial<FeedbackNodeData>)
          setEdges(eds =>
            addEdge(
              { source: targetNodeId, sourceHandle: portId, target: fromNode.id, targetHandle: fromHandle.id, id: crypto.randomUUID() },
              eds
            )
          )
        }
      } else if (!targetNodeId) {
        // ── Dropped on empty canvas space → create a new node ──
        const position = screenToFlowPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY })
        const newNodeId = crypto.randomUUID()
        const portId = crypto.randomUUID()

        let newNodeData: FeedbackNodeData
        let newEdge: Edge

        if (isFromOutput) {
          const portLabel = receivingLabel('in1')
          newNodeData = { label: 'Expression', inputs: [{ id: portId, label: portLabel }], outputs: [] }
          newEdge = { id: crypto.randomUUID(), source: fromNode.id, sourceHandle: fromHandle.id, target: newNodeId, targetHandle: portId }
        } else {
          const portLabel = receivingLabel('out1')
          newNodeData = { label: 'Expression', inputs: [], outputs: [{ id: portId, label: portLabel }] }
          newEdge = { id: crypto.randomUUID(), source: newNodeId, sourceHandle: portId, target: fromNode.id, targetHandle: fromHandle.id }
        }

        setNodes(nds => {
          const freePos = findFreePosition(position, nds)
          const newNode: Node<FeedbackNodeData> = {
            id: newNodeId,
            type: 'feedbackNode',
            position: freePos,
            dragHandle: '.node-header',
            data: newNodeData,
          }
          return [...nds, newNode]
        })
        setEdges(eds => [...eds, newEdge])
      }
      // else: dropped on the same node — ignore
    },
    [setEdges, setNodes, getNode, updateNodeData, screenToFlowPosition]
  )

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/feedback-node')
    if (!raw) return
    const template: NodeTemplate = JSON.parse(raw)
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode(position, template)
  }

  return (
    // Prevent browser context menu so right-click can pan freely
    <div
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
        onNodeDragStart={(_e, node) => {
          nodeDragOrigin.current = { id: node.id, position: { ...node.position } }
        }}
        onNodeDragStop={(e, node) => {
          if (drawerOpen && onSaveNodeToLibrary && e.clientX > window.innerWidth - drawerWidth) {
            onSaveNodeToLibrary(node.data as FeedbackNodeData)
            // Snap node back to where it started
            if (nodeDragOrigin.current?.id === node.id) {
              const origin = nodeDragOrigin.current.position
              setNodes(nds => nds.map(n => n.id === node.id ? { ...n, position: origin } : n))
            }
          }
          nodeDragOrigin.current = null
        }}
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
