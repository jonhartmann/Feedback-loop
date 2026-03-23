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

import { createContext, useContext, useMemo } from 'react'
import { useNodes, useEdges } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import type { FeedbackNodeData, Unit } from '../types/graph'
import { buildEvalMaps } from '../utils/graphEval'

// Re-export pure utilities so existing SimContext imports are unchanged
export { buildEvalMaps, buildEvalMapsWithIndex } from '../utils/graphEval'

type EvalMap = Map<string, number>
type UnitMap = Map<string, Unit>

interface GraphEvalMaps {
  evalMap: EvalMap
  unitMap: UnitMap
}

const GraphEvalContext = createContext<GraphEvalMaps>({ evalMap: new Map(), unitMap: new Map() })

export function useEvalMap(): EvalMap {
  return useContext(GraphEvalContext).evalMap
}

export function useUnitMap(): UnitMap {
  return useContext(GraphEvalContext).unitMap
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function GraphEvalProvider({ children }: { children: React.ReactNode }) {
  const nodes = useNodes() as Node<FeedbackNodeData>[]
  const edges = useEdges()

  const maps = useMemo<GraphEvalMaps>(() => buildEvalMaps(nodes, edges), [nodes, edges])

  return (
    <GraphEvalContext.Provider value={maps}>
      {children}
    </GraphEvalContext.Provider>
  )
}
