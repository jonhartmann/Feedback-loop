import { useCallback, useRef } from 'react'
import { addEdge, useReactFlow } from '@xyflow/react'
import type { Edge, Connection, Node } from '@xyflow/react'
import type { FeedbackNodeData, Port, OutputPort } from '../types/graph'
import { findFreePosition } from '../utils/placement'
import { toCamelCase } from '../utils/formulaEval'
import { ADD_INPUT_HANDLE_ID } from './FeedbackNode/InputsColumn'

interface UseCanvasConnectionsProps {
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void
  setNodes: (updater: (nodes: Node<FeedbackNodeData>[]) => Node<FeedbackNodeData>[]) => void
}

export function useCanvasConnections({ setEdges, setNodes }: UseCanvasConnectionsProps) {
  const { screenToFlowPosition, getNode, updateNodeData, getEdges } = useReactFlow()

  // Set when the user grabs an occupied INPUT handle so we can redirect the
  // resulting connection to use the original source node/handle.
  const pendingReconnect = useRef<{
    originalSourceId: string
    originalSourceHandleId: string
  } | null>(null)

  const onReconnectStart = useCallback(() => {}, [])
  const onReconnectEnd = useCallback(() => {}, [])

  // Allow all connections — when pendingReconnect is active the grabbed handle
  // is a target type being used as a source, so we need to bypass React Flow's
  // default source-only validation.
  const isValidConnection = useCallback(() => true, [])

  const onConnectStart = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      params: { nodeId?: string | null; handleId?: string | null; handleType?: string | null }
    ) => {
      const { nodeId, handleId, handleType } = params
      if (!nodeId || !handleId) return
      const currentEdges = getEdges()

      if (handleType === 'target') {
        // User grabbed an occupied INPUT handle. Remove the existing edge and
        // store the original source so onConnect can redirect it.
        const existingEdge = currentEdges.find(
          e => e.target === nodeId && e.targetHandle === handleId
        )
        if (existingEdge) {
          setEdges(eds => eds.filter(e => e.id !== existingEdge.id))
          pendingReconnect.current = {
            originalSourceId: existingEdge.source,
            originalSourceHandleId: existingEdge.sourceHandle ?? '',
          }
        }
      }
      // Output handles (source) keep their existing edges — dragging from an
      // occupied output just adds another connection (fan-out).
    },
    [setEdges, getEdges]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      // ── Pending reconnect: user grabbed an input handle ──
      // Redirect so the edge uses the original source, not the grabbed handle.
      if (pendingReconnect.current) {
        const pending = pendingReconnect.current
        pendingReconnect.current = null

        const realConn: Connection = {
          source: pending.originalSourceId,
          sourceHandle: pending.originalSourceHandleId,
          // connection.target/targetHandle are the handle the user dropped on.
          // When dragging from a target handle React Flow may put the drop node
          // in either .target or .source; normalise to .target.
          target: connection.target ?? connection.source,
          targetHandle: connection.targetHandle ?? connection.sourceHandle,
        }

        if (realConn.targetHandle === ADD_INPUT_HANDLE_ID && realConn.target) {
          const targetNode = getNode(realConn.target)
          if (!targetNode) return
          const targetData = targetNode.data as FeedbackNodeData
          const portId = crypto.randomUUID()
          let portLabel = `in${(targetData.inputs?.length ?? 0) + 1}`
          if (realConn.source) {
            const sourceNode = getNode(realConn.source)
            if (sourceNode) {
              const sd = sourceNode.data as FeedbackNodeData
              if (sd.variant === 'constant' || sd.variant === 'measure')
                portLabel = toCamelCase(sd.label) || portLabel
            }
          }
          updateNodeData(realConn.target, {
            inputs: [...(targetData.inputs ?? []), { id: portId, label: portLabel }],
          } as Partial<FeedbackNodeData>)
          setEdges(eds => addEdge({ ...realConn, targetHandle: portId, id: crypto.randomUUID() }, eds))
          return
        }

        if (realConn.source && realConn.target && realConn.targetHandle) {
          const sourceNode = getNode(realConn.source)
          const targetNode = getNode(realConn.target)
          if (sourceNode && targetNode) {
            const sd = sourceNode.data as FeedbackNodeData
            if (sd.variant === 'constant' || sd.variant === 'measure') {
              const newLabel = toCamelCase(sd.label) || 'value'
              const td = targetNode.data as FeedbackNodeData
              updateNodeData(realConn.target, {
                inputs: (td.inputs ?? []).map(p =>
                  p.id === realConn.targetHandle ? { ...p, label: newLabel } : p
                ),
              } as Partial<FeedbackNodeData>)
            }
          }
        }

        setEdges(eds => {
          const base =
            realConn.targetHandle && realConn.targetHandle !== ADD_INPUT_HANDLE_ID
              ? eds.filter(e => !(e.target === realConn.target && e.targetHandle === realConn.targetHandle))
              : eds
          return addEdge({ ...realConn, id: crypto.randomUUID() }, base)
        })
        return
      }

      // ── Drop onto the "add input" sentinel handle → create a real port ──
      if (connection.targetHandle === ADD_INPUT_HANDLE_ID && connection.target) {
        const targetNode = getNode(connection.target)
        if (!targetNode) return
        const targetData = targetNode.data as FeedbackNodeData
        const portId = crypto.randomUUID()

        let portLabel = `in${(targetData.inputs?.length ?? 0) + 1}`
        if (connection.source) {
          const sourceNode = getNode(connection.source)
          if (sourceNode) {
            const sourceData = sourceNode.data as FeedbackNodeData
            if (sourceData.variant === 'constant' || sourceData.variant === 'measure')
              portLabel = toCamelCase(sourceData.label) || portLabel
          }
        }

        updateNodeData(connection.target, {
          inputs: [...(targetData.inputs ?? []), { id: portId, label: portLabel }],
        } as Partial<FeedbackNodeData>)
        setEdges(eds => addEdge({ ...connection, targetHandle: portId, id: crypto.randomUUID() }, eds))
        return
      }

      // ── Normal connection ──
      if (connection.source && connection.target && connection.targetHandle) {
        const sourceNode = getNode(connection.source)
        const targetNode = getNode(connection.target)
        if (sourceNode && targetNode) {
          const sourceData = sourceNode.data as FeedbackNodeData
          if (sourceData.variant === 'constant' || sourceData.variant === 'measure') {
            const newLabel = toCamelCase(sourceData.label) || 'value'
            const targetData = targetNode.data as FeedbackNodeData
            updateNodeData(connection.target, {
              inputs: (targetData.inputs ?? []).map(p =>
                p.id === connection.targetHandle ? { ...p, label: newLabel } : p
              ),
            } as Partial<FeedbackNodeData>)
          }
        }
      }

      setEdges(eds => {
        const base =
          connection.targetHandle && connection.targetHandle !== ADD_INPUT_HANDLE_ID
            ? eds.filter(e => !(e.target === connection.target && e.targetHandle === connection.targetHandle))
            : eds
        return addEdge({ ...connection, id: crypto.randomUUID() }, base)
      })
    },
    [setEdges, getNode, updateNodeData]
  )

  // Edge endpoint drag (edgesReconnectable). Replace any existing edge at the new target.
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges(eds => {
        const withoutOld = eds.filter(e => e.id !== oldEdge.id)
        const withoutTargetConflict =
          newConnection.targetHandle && newConnection.targetHandle !== ADD_INPUT_HANDLE_ID
            ? withoutOld.filter(
                e => !(e.target === newConnection.target && e.targetHandle === newConnection.targetHandle)
              )
            : withoutOld
        return addEdge(
          {
            ...oldEdge,
            source: newConnection.source,
            sourceHandle: newConnection.sourceHandle,
            target: newConnection.target,
            targetHandle: newConnection.targetHandle,
          },
          withoutTargetConflict
        )
      })
    },
    [setEdges]
  )

  // When a connection drag ends without landing on a valid handle:
  // – If over another node's body → create a matching port on that node and connect
  // – If over empty space → create a new node with the matching port and connect
  const onConnectEnd = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      if (connectionState.isValid) return // onConnect already handled it

      const pending = pendingReconnect.current
      pendingReconnect.current = null

      const { fromNode: rawFromNode, fromHandle } = connectionState
      if (!rawFromNode || !fromHandle || !fromHandle.id) return

      // If there's a pending reconnect the effective "from" is the original source.
      const isFromOutput = pending ? true : fromHandle.type === 'source'
      const effectiveFromNodeId = pending ? pending.originalSourceId : rawFromNode.id
      const effectiveFromHandleId = pending ? pending.originalSourceHandleId : fromHandle.id
      const fromNode = pending ? getNode(effectiveFromNodeId) : rawFromNode
      if (!fromNode) return

      const fromData = fromNode.data as FeedbackNodeData
      const sourcePort = isFromOutput
        ? fromData.outputs?.find((p: Port) => p.id === effectiveFromHandleId)
        : fromData.inputs?.find((p: Port) => p.id === effectiveFromHandleId)
      const sourceLabel = sourcePort?.label ?? ''
      const isDefaultLabel = isFromOutput ? /^out\d+$/.test(sourceLabel) : /^in\d+$/.test(sourceLabel)
      const receivingLabel = (fallback: string) => (!isDefaultLabel && sourceLabel) ? sourceLabel : fallback

      const mouseEvent = event as MouseEvent
      const element = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY)

      if (element?.closest('.react-flow__handle')) return

      const nodeEl = element?.closest('.react-flow__node')
      const targetNodeId = nodeEl?.getAttribute('data-id') ?? null

      if (targetNodeId && targetNodeId !== effectiveFromNodeId) {
        // ── Dropped on another node's body ──
        const targetNode = getNode(targetNodeId)
        if (!targetNode) return
        const targetData = targetNode.data as FeedbackNodeData
        const portId = crypto.randomUUID()

        if (isFromOutput) {
          const fallback = `in${(targetData.inputs?.length ?? 0) + 1}`
          const newPort: Port = { id: portId, label: receivingLabel(fallback) }
          updateNodeData(targetNodeId, { inputs: [...(targetData.inputs ?? []), newPort] } as Partial<FeedbackNodeData>)
          setEdges(eds =>
            addEdge({ source: effectiveFromNodeId, sourceHandle: effectiveFromHandleId, target: targetNodeId, targetHandle: portId, id: crypto.randomUUID() }, eds)
          )
        } else {
          const existingOutputs = targetData.outputs ?? []
          const freeOutput = existingOutputs.find(p =>
            !connectionState.edges?.some((e: Edge) => e.source === targetNodeId && e.sourceHandle === p.id)
          )
          if (freeOutput) {
            setEdges(eds =>
              addEdge({ source: targetNodeId, sourceHandle: freeOutput.id, target: effectiveFromNodeId, targetHandle: effectiveFromHandleId, id: crypto.randomUUID() }, eds)
            )
          } else if (existingOutputs.length === 0) {
            const newPort: OutputPort = { id: portId, label: receivingLabel('out1') }
            updateNodeData(targetNodeId, { outputs: [newPort] } as Partial<FeedbackNodeData>)
            setEdges(eds =>
              addEdge({ source: targetNodeId, sourceHandle: portId, target: effectiveFromNodeId, targetHandle: effectiveFromHandleId, id: crypto.randomUUID() }, eds)
            )
          }
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
          newNodeData = { label: 'Expression', inputs: [{ id: portId, label: portLabel }], outputs: [{ id: crypto.randomUUID(), label: 'out1' }] }
          newEdge = { id: crypto.randomUUID(), source: effectiveFromNodeId, sourceHandle: effectiveFromHandleId, target: newNodeId, targetHandle: portId }
        } else {
          const portLabel = receivingLabel('out1')
          newNodeData = { label: 'Expression', inputs: [], outputs: [{ id: portId, label: portLabel }] }
          newEdge = { id: crypto.randomUUID(), source: newNodeId, sourceHandle: portId, target: effectiveFromNodeId, targetHandle: effectiveFromHandleId }
        }

        setNodes(nds => {
          const freePos = findFreePosition(position, nds)
          return [...nds, { id: newNodeId, type: 'feedbackNode', position: freePos, dragHandle: '.feedback-node__header', data: newNodeData }]
        })
        setEdges(eds => [...eds, newEdge])
      }
    },
    [setEdges, setNodes, getNode, updateNodeData, screenToFlowPosition]
  )

  return { onConnect, onConnectStart, onConnectEnd, onReconnect, onReconnectStart, onReconnectEnd, isValidConnection }
}
