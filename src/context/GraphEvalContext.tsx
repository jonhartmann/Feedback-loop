/**
 * GraphEvalContext — propagates concrete numeric values and units through the graph.
 *
 * The provider sits above <FlowCanvas> (but inside <ReactFlowProvider>).
 * It subscribes to all node/edge changes via useNodes/useEdges and recursively
 * resolves output-port values and units, storing them in Maps keyed by "nodeId:portId".
 * Metric nodes use the special portId "__metric".
 *
 * Cycles are detected via a per-path `visited` set passed through recursive calls.
 * Edge lookups use a pre-built index (Map<"targetId:targetHandle", Edge>) so each
 * lookup is O(1) instead of O(edges).
 */

import { createContext, useContext, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNodes, useEdges } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import type { FeedbackNodeData, Unit } from '../types/graph'
import { buildEvalMaps } from '../utils/graphEval'

// Re-export pure utilities so existing SimContext imports are unchanged
export { buildEvalMaps, buildEvalMapsWithIndex } from '../utils/graphEval'

import { buildHasMeasureMap } from '../utils/graphEval'

type EvalMap = Map<string, number>
type UnitMap = Map<string, Unit>

interface GraphEvalContextValue {
  evalMap: EvalMap
  unitMap: UnitMap
  hasMeasureMap: Map<string, boolean>
  getValueHistory: (nodeId: string, portId: string) => number[]
}

const GraphEvalContext = createContext<GraphEvalContextValue>({
  evalMap: new Map(), unitMap: new Map(), hasMeasureMap: new Map(),
  getValueHistory: () => [],
})

export function useEvalMap(): EvalMap {
  return useContext(GraphEvalContext).evalMap
}

export function useUnitMap(): UnitMap {
  return useContext(GraphEvalContext).unitMap
}

export function useCanShowSeries(nodeId: string): boolean {
  return useContext(GraphEvalContext).hasMeasureMap.get(nodeId) ?? false
}

export function useValueHistory(nodeId: string, portId: string): number[] {
  return useContext(GraphEvalContext).getValueHistory(nodeId, portId)
}

export function useGetValueHistory(): (nodeId: string, portId: string) => number[] {
  return useContext(GraphEvalContext).getValueHistory
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function GraphEvalProvider({ children }: { children: React.ReactNode }) {
  const nodes = useNodes() as Node<FeedbackNodeData>[]
  const edges = useEdges()

  const maps = useMemo(() => ({
    ...buildEvalMaps(nodes, edges),
    hasMeasureMap: buildHasMeasureMap(nodes, edges),
  }), [nodes, edges])

  const historyBufferRef = useRef<Map<string, number[]>>(new Map())

  useEffect(() => {
    for (const [key, val] of maps.evalMap) {
      const nodeId = key.split(':')[0]
      if (!maps.hasMeasureMap.get(nodeId)) continue
      const arr = historyBufferRef.current.get(key) ?? []
      if (arr.length > 0 && arr[arr.length - 1] === val) continue
      historyBufferRef.current.set(key, [...arr.slice(-19), val])
    }
  }, [maps])

  const getValueHistory = useCallback((nodeId: string, portId: string) =>
    historyBufferRef.current.get(`${nodeId}:${portId}`) ?? []
  , [])

  const contextValue = useMemo(() => ({ ...maps, getValueHistory }), [maps, getValueHistory])

  return (
    <GraphEvalContext.Provider value={contextValue}>
      {children}
    </GraphEvalContext.Provider>
  )
}
