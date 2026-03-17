/**
 * GraphEvalContext — propagates concrete numeric values and units through the graph.
 *
 * The provider sits above <FlowCanvas> (but inside <ReactFlowProvider>).
 * It subscribes to all node/edge changes via useNodes/useEdges and recursively
 * resolves output-port values and units, storing them in Maps keyed by "nodeId:portId".
 * Metric nodes use the special portId "__metric".
 *
 * Cycles are detected via a per-call `visited` set and resolve to undefined/number.
 */

import { createContext, useContext, useMemo } from 'react'
import { useNodes, useEdges } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import type { FeedbackNodeData, Unit } from '../types/graph'
import { evalFormula, buildScope, labelToVarName, dominantUnit } from '../utils/formulaEval'

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

// ── Internal graph traversal ──────────────────────────────────────────────────

/** Resolve the numeric value of a specific output port (or "__metric" for metric nodes). */
function resolveOutputValue(
  nodeId: string,
  portId: string,
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
  visited: Set<string>,
): number | undefined {
  const key = `${nodeId}::${portId}`
  if (visited.has(key)) return undefined   // cycle — leave symbolic
  visited.add(key)

  const node = nodes.find(n => n.id === nodeId)
  if (!node) return undefined
  const data = node.data as FeedbackNodeData

  // ── Metric formula ────────────────────────────────────────────────────────
  if (portId === '__metric') {
    if (!data.metricFormula) return undefined
    const scope = buildScope(data.variables ?? [], new Map())
    for (const input of data.inputs ?? []) {
      const edge = edges.find(e => e.target === nodeId && e.targetHandle === input.id)
      if (edge && edge.sourceHandle) {
        const val = resolveOutputValue(edge.source, edge.sourceHandle, nodes, edges, new Set(visited))
        if (val !== undefined) {
          scope[labelToVarName(input.label)] = val
        }
      }
    }
    const result = evalFormula(data.metricFormula, scope)
    return result.type === 'number' ? result.value : undefined
  }

  // ── Regular output port ───────────────────────────────────────────────────
  const port = data.outputs?.find(p => p.id === portId)
  if (!port) return undefined

  // Direct value (constant / measure)
  if (port.value !== undefined && isFinite(port.value)) return port.value

  // Formula output — build scope from node variables + resolved upstream inputs
  if (port.formula) {
    const scope = buildScope(data.variables ?? [], new Map())
    for (const input of data.inputs ?? []) {
      const edge = edges.find(e => e.target === nodeId && e.targetHandle === input.id)
      if (edge && edge.sourceHandle) {
        const val = resolveOutputValue(edge.source, edge.sourceHandle, nodes, edges, new Set(visited))
        if (val !== undefined) {
          scope[labelToVarName(input.label)] = val
        }
      }
    }
    const result = evalFormula(port.formula, scope)
    if (result.type === 'number') return result.value
  }

  return undefined
}

/** Resolve the display unit of an output port or metric, using explicit setting or input inference. */
function resolveUnit(
  nodeId: string,
  portId: string,
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
  visited: Set<string>,
): Unit {
  const key = `${nodeId}::${portId}`
  if (visited.has(key)) return 'number'   // cycle guard
  visited.add(key)

  const node = nodes.find(n => n.id === nodeId)
  if (!node) return 'number'
  const data = node.data as FeedbackNodeData

  // ── Metric ────────────────────────────────────────────────────────────────
  if (portId === '__metric') {
    if (data.metricUnit) return data.metricUnit
    return dominantUnit(
      (data.inputs ?? []).map(input => {
        const edge = edges.find(e => e.target === nodeId && e.targetHandle === input.id)
        if (!edge?.sourceHandle) return undefined
        return resolveUnit(edge.source, edge.sourceHandle, nodes, edges, new Set(visited))
      })
    )
  }

  // ── Regular output port ───────────────────────────────────────────────────
  const port = data.outputs?.find(p => p.id === portId)
  if (!port) return 'number'

  // Explicit unit — use it
  if (port.unit) return port.unit

  // Value nodes with no explicit unit default to 'number'
  if (data.variant === 'constant' || data.variant === 'measure') return 'number'

  // Regular nodes — infer from the units of all connected inputs
  return dominantUnit(
    (data.inputs ?? []).map(input => {
      const edge = edges.find(e => e.target === nodeId && e.targetHandle === input.id)
      if (!edge?.sourceHandle) return undefined
      return resolveUnit(edge.source, edge.sourceHandle, nodes, edges, new Set(visited))
    })
  )
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function GraphEvalProvider({ children }: { children: React.ReactNode }) {
  const nodes = useNodes() as Node<FeedbackNodeData>[]
  const edges = useEdges()

  const maps = useMemo<GraphEvalMaps>(() => {
    const evalMap = new Map<string, number>()
    const unitMap = new Map<string, Unit>()

    for (const node of nodes) {
      // Regular output ports
      for (const port of node.data.outputs ?? []) {
        const val = resolveOutputValue(node.id, port.id, nodes, edges, new Set())
        if (val !== undefined) evalMap.set(`${node.id}:${port.id}`, val)
        unitMap.set(`${node.id}:${port.id}`, resolveUnit(node.id, port.id, nodes, edges, new Set()))
      }

      // Metric formula result (no output handles, but still needs an evaluated value)
      if (node.data.variant === 'metric') {
        const val = resolveOutputValue(node.id, '__metric', nodes, edges, new Set())
        if (val !== undefined) evalMap.set(`${node.id}:__metric`, val)
        unitMap.set(`${node.id}:__metric`, resolveUnit(node.id, '__metric', nodes, edges, new Set()))
      }
    }

    return { evalMap, unitMap }
  }, [nodes, edges])

  return (
    <GraphEvalContext.Provider value={maps}>
      {children}
    </GraphEvalContext.Provider>
  )
}
