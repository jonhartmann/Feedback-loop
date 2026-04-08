import { useRef } from 'react'
import type { Node } from '@xyflow/react'
import { useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData, NodeTemplate, NodeVariant } from '../types/graph'

interface UseDragToLibraryProps {
  setNodes: (updater: (nodes: Node<FeedbackNodeData>[]) => Node<FeedbackNodeData>[]) => void
  addNode: (position: { x: number; y: number }, variantOrTemplate: NodeVariant | NodeTemplate) => void
  drawerOpen?: boolean
  drawerWidth?: number
  onSaveNodeToLibrary?: (data: FeedbackNodeData) => void
}

export function useDragToLibrary({
  setNodes,
  addNode,
  drawerOpen,
  drawerWidth = 260,
  onSaveNodeToLibrary,
}: UseDragToLibraryProps) {
  const { screenToFlowPosition } = useReactFlow()
  const nodeDragOrigin = useRef<{ id: string; position: { x: number; y: number } } | null>(null)

  function onNodeDragStart(_e: React.MouseEvent, node: Node<FeedbackNodeData>) {
    nodeDragOrigin.current = { id: node.id, position: { ...node.position } }
  }

  function onNodeDragStop(e: React.MouseEvent, node: Node<FeedbackNodeData>) {
    if (drawerOpen && onSaveNodeToLibrary && e.clientX > window.innerWidth - drawerWidth) {
      onSaveNodeToLibrary(node.data as FeedbackNodeData)
      if (nodeDragOrigin.current?.id === node.id) {
        const origin = nodeDragOrigin.current.position
        setNodes(nds => nds.map(n => n.id === node.id ? { ...n, position: origin } : n))
      }
    }
    nodeDragOrigin.current = null
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

    const raw = e.dataTransfer.getData('application/feedback-node')
    if (raw) {
      const template: NodeTemplate = JSON.parse(raw)
      addNode(position, template)
      return
    }

    const variant = e.dataTransfer.getData('application/feedback-variant')
    if (variant) {
      addNode(position, variant as NodeVariant)
    }
  }

  return { onNodeDragStart, onNodeDragStop, handleDrop }
}
