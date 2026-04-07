import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import type { FeedbackNodeData } from '../types/graph'

export function useDataRefresh(intervalMs = 3000) {
  const { getNodes, setNodes } = useReactFlow()

  useEffect(() => {
    async function refresh() {
      const nodes = getNodes() as Node<FeedbackNodeData>[]
      const measureNodes = nodes.filter(n => n.data.variant === 'measure' && n.data.inputs[0]?.sourceUrl)
      const results = await Promise.allSettled(
        measureNodes.map(n =>
          fetch(n.data.inputs[0].sourceUrl!)
            .then(r => r.json())
            .then((j: { value: number }) => ({ id: n.id, value: j.value }))
        )
      )

      // Collect all successful updates keyed by node id
      const updates = new Map<string, number>()
      for (const result of results) {
        if (result.status === 'fulfilled') updates.set(result.value.id, result.value.value)
      }
      if (updates.size === 0) return

      // Apply all updates in a single setNodes call → single state update → single graph re-evaluation
      // For measure nodes, the fetched value lives on inputs[0].value
      setNodes(prev => (prev as Node<FeedbackNodeData>[]).map(node => {
        const newValue = updates.get(node.id)
        if (newValue === undefined || !node.data.inputs?.[0]) return node
        const inputs = node.data.inputs.map((p, i) => i === 0 ? { ...p, value: newValue } : p)
        return { ...node, data: { ...node.data, inputs } }
      }))
    }

    const timer = setInterval(refresh, intervalMs)
    refresh()
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
