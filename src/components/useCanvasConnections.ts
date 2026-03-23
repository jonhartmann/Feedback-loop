import { useCallback, useRef } from 'react'
import { addEdge, useReactFlow } from '@xyflow/react'
import type { Edge, Connection, Node } from '@xyflow/react'
import type { FeedbackNodeData, Port, OutputPort } from '../types/graph'
import { findFreePosition } from '../utils/placement'

interface UseCanvasConnectionsProps {
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void
  setNodes: (updater: (nodes: Node<FeedbackNodeData>[]) => Node<FeedbackNodeData>[]) => void
}

export function useCanvasConnections({ setEdges, setNodes }: UseCanvasConnectionsProps) {
  const { screenToFlowPosition, getNode, updateNodeData } = useReactFlow()
  const isReconnecting = useRef(false)

  const onReconnectStart = useCallback(() => {
    isReconnecting.current = true
  }, [])

  const onReconnectEnd = useCallback(() => {
    setTimeout(() => { isReconnecting.current = false }, 0)
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge({ ...connection, id: crypto.randomUUID() }, eds))
    },
    [setEdges]
  )

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
      if (connectionState.isValid) return
      if (isReconnecting.current) return

      const { fromNode, fromHandle } = connectionState
      if (!fromNode || !fromHandle || !fromHandle.id) return

      const isFromOutput = fromHandle.type === 'source'

      const fromData = fromNode.data as FeedbackNodeData
      const sourcePort = isFromOutput
        ? fromData.outputs?.find((p: Port) => p.id === fromHandle.id)
        : fromData.inputs?.find((p: Port) => p.id === fromHandle.id)
      const sourceLabel = sourcePort?.label ?? ''

      const isDefaultLabel = isFromOutput
        ? /^out\d+$/.test(sourceLabel)
        : /^in\d+$/.test(sourceLabel)

      const receivingLabel = (fallback: string) =>
        (!isDefaultLabel && sourceLabel) ? sourceLabel : fallback

      const mouseEvent = event as MouseEvent
      const element = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY)

      if (element?.closest('.react-flow__handle')) return

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
    },
    [setEdges, setNodes, getNode, updateNodeData, screenToFlowPosition]
  )

  return { onConnect, onConnectEnd, onReconnect, onReconnectStart, onReconnectEnd }
}
