import { useState } from 'react'

export function useDragDropPort(reorderPorts: (fromId: string, toId: string, type: 'input' | 'output') => void) {
  const [draggedPort, setDraggedPort] = useState<{ id: string; type: 'input' | 'output' } | null>(null)
  const [dragOverPortId, setDragOverPortId] = useState<string | null>(null)

  function getPortRowDragProps(portId: string, type: 'input' | 'output') {
    return {
      className: `port__row${dragOverPortId === portId && draggedPort?.type === type ? ' port__row--drag-over' : ''}`,
      onDragOver: (e: React.DragEvent) => { if (draggedPort?.type === type) { e.preventDefault(); setDragOverPortId(portId) } },
      onDragLeave: () => setDragOverPortId(null),
      onDrop: () => { if (draggedPort?.type === type) { reorderPorts(draggedPort.id, portId, type); setDraggedPort(null); setDragOverPortId(null) } },
    }
  }

  function getDragHandleProps(portId: string, type: 'input' | 'output') {
    return {
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => { e.stopPropagation(); setDraggedPort({ id: portId, type }) },
      onDragEnd: () => { setDraggedPort(null); setDragOverPortId(null) },
    }
  }

  return { getPortRowDragProps, getDragHandleProps }
}
