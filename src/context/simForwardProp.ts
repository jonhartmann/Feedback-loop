import { useMemo } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { FeedbackNodeData } from '../types/graph'
import { METRIC_PORT_ID } from '../types/graph'
import { buildEvalMaps } from '../utils/graphEval'

type EvalMap = Map<string, number>

interface SimForwardPropResult {
  simEvalMap: EvalMap
  deltaMap: Map<string, number>
}

export function useSimEvalMap(
  simMode: boolean,
  simOverlay: Map<string, number>,
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
  baseEvalMap: EvalMap,
): SimForwardPropResult {
  return useMemo(() => {
    if (!simMode || simOverlay.size === 0) {
      return { simEvalMap: baseEvalMap, deltaMap: new Map<string, number>() }
    }

    const simNodes = nodes.map(node => {
      const outputList = node.data.outputs ?? []
      let changed = false
      const newOutputs = outputList.map(port => {
        const pctAdj = simOverlay.get(`${node.id}:${port.id}`)
        if (pctAdj === undefined) return port
        changed = true
        const liveBase = (port.value !== undefined && isFinite(port.value))
          ? port.value
          : (baseEvalMap.get(`${node.id}:${port.id}`) ?? 0)
        return { ...port, value: liveBase * (1 + pctAdj), formula: undefined }
      })
      return changed ? { ...node, data: { ...node.data, outputs: newOutputs } } : node
    })

    const { evalMap: rawSimEvalMap } = buildEvalMaps(simNodes, edges)

    // Metric outputs aren't formula ports — apply fractional override post-hoc
    for (const node of nodes) {
      if (node.data.variant === 'metric') {
        const pctAdj = simOverlay.get(`${node.id}:${METRIC_PORT_ID}`)
        if (pctAdj !== undefined) {
          const liveBase = baseEvalMap.get(`${node.id}:${METRIC_PORT_ID}`) ?? 0
          rawSimEvalMap.set(`${node.id}:${METRIC_PORT_ID}`, liveBase * (1 + pctAdj))
        }
      }
    }

    const deltaMap = new Map<string, number>()
    for (const [key, simVal] of rawSimEvalMap) {
      const baseVal = baseEvalMap.get(key) ?? 0
      const delta = simVal - baseVal
      if (Math.abs(delta) > 1e-10) deltaMap.set(key, delta)
    }

    return { simEvalMap: rawSimEvalMap, deltaMap }
  }, [simMode, simOverlay, nodes, edges, baseEvalMap])
}
