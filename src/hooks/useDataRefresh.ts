import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import type { FeedbackNodeData } from '../types/graph'

export function useDataRefresh(intervalMs = 3000) {
  const { getNodes, updateNodeData } = useReactFlow()

  useEffect(() => {
    async function refresh() {
      const nodes = getNodes() as Node<FeedbackNodeData>[]
      const measureNodes = nodes.filter(n => n.data.variant === 'measure' && n.data.sourceUrl)
      const results = await Promise.allSettled(
        measureNodes.map(n =>
          fetch(n.data.sourceUrl!)
            .then(r => r.json())
            .then((j: { value: number }) => ({ id: n.id, value: j.value }))
        )
      )
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { id, value } = result.value
          const node = (getNodes() as Node<FeedbackNodeData>[]).find(n => n.id === id)
          if (!node?.data.outputs?.[0]) continue
          const outputs = node.data.outputs.map((p, i) => i === 0 ? { ...p, value } : p)
          updateNodeData(id, { outputs })
        }
      }
    }

    const timer = setInterval(refresh, intervalMs)
    refresh()
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
