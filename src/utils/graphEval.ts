/**
 * Pure graph evaluation utilities.
 * Resolves numeric values and units through the node graph via recursive traversal.
 * Exported and reused by both GraphEvalContext and SimContext.
 */

import type { Node, Edge } from '@xyflow/react'
import type { FeedbackNodeData, Unit } from '../types/graph'
import { METRIC_PORT_ID } from '../types/graph'
import { evalFormula, buildScope, labelToVarName, dominantUnit } from './formulaEval'

type EvalMap = Map<string, number>
type UnitMap = Map<string, Unit>
// Key: "targetNodeId:targetHandle" → the incoming edge
export type EdgeIndex = Map<string, Edge>

export interface GraphEvalMaps {
  evalMap: EvalMap
  unitMap: UnitMap
}

/** Resolve the numeric value of a specific output port (or "__metric" for metric nodes). */
function resolveOutputValue(
  nodeId: string,
  portId: string,
  nodes: Node<FeedbackNodeData>[],
  edgeIndex: EdgeIndex,
  visited: Set<string>,
): number | undefined {
  const key = `${nodeId}::${portId}`
  if (visited.has(key)) return undefined   // cycle — leave symbolic
  visited.add(key)

  const node = nodes.find(n => n.id === nodeId)
  if (!node) return undefined
  const data = node.data as FeedbackNodeData

  // ── Metric formula ────────────────────────────────────────────────────────
  if (portId === METRIC_PORT_ID) {
    if (!data.metricFormula) return undefined
    const scope = buildScope(data.variables ?? [], new Map())
    for (const input of data.inputs ?? []) {
      const edge = edgeIndex.get(`${nodeId}:${input.id}`)
      if (edge?.sourceHandle) {
        const val = resolveOutputValue(edge.source, edge.sourceHandle, nodes, edgeIndex, new Set(visited))
        if (val !== undefined) scope[labelToVarName(input.label)] = val
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
      const edge = edgeIndex.get(`${nodeId}:${input.id}`)
      if (edge?.sourceHandle) {
        const val = resolveOutputValue(edge.source, edge.sourceHandle, nodes, edgeIndex, new Set(visited))
        if (val !== undefined) scope[labelToVarName(input.label)] = val
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
  edgeIndex: EdgeIndex,
  visited: Set<string>,
): Unit {
  const key = `${nodeId}::${portId}`
  if (visited.has(key)) return 'number'   // cycle guard
  visited.add(key)

  const node = nodes.find(n => n.id === nodeId)
  if (!node) return 'number'
  const data = node.data as FeedbackNodeData

  // ── Metric ────────────────────────────────────────────────────────────────
  if (portId === METRIC_PORT_ID) {
    if (data.metricUnit) return data.metricUnit
    return dominantUnit(
      (data.inputs ?? []).map(input => {
        const edge = edgeIndex.get(`${nodeId}:${input.id}`)
        if (!edge?.sourceHandle) return undefined
        return resolveUnit(edge.source, edge.sourceHandle, nodes, edgeIndex, new Set(visited))
      })
    )
  }

  // ── Regular output port ───────────────────────────────────────────────────
  const port = data.outputs?.find(p => p.id === portId)
  if (!port) return 'number'

  if (port.unit) return port.unit
  if (data.variant === 'constant' || data.variant === 'measure') return 'number'

  return dominantUnit(
    (data.inputs ?? []).map(input => {
      const edge = edgeIndex.get(`${nodeId}:${input.id}`)
      if (!edge?.sourceHandle) return undefined
      return resolveUnit(edge.source, edge.sourceHandle, nodes, edgeIndex, new Set(visited))
    })
  )
}

export function buildEvalMaps(
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
): GraphEvalMaps {
  const edgeIndex: EdgeIndex = new Map()
  for (const e of edges) {
    if (e.targetHandle) edgeIndex.set(`${e.target}:${e.targetHandle}`, e)
  }
  return buildEvalMapsWithIndex(nodes, edgeIndex)
}

export function buildEvalMapsWithIndex(
  nodes: Node<FeedbackNodeData>[],
  edgeIndex: EdgeIndex,
): GraphEvalMaps {
  const evalMap = new Map<string, number>()
  const unitMap = new Map<string, Unit>()

  for (const node of nodes) {
    for (const port of node.data.outputs ?? []) {
      const val = resolveOutputValue(node.id, port.id, nodes, edgeIndex, new Set())
      if (val !== undefined) evalMap.set(`${node.id}:${port.id}`, val)
      unitMap.set(`${node.id}:${port.id}`, resolveUnit(node.id, port.id, nodes, edgeIndex, new Set()))
    }
    if (node.data.variant === 'metric') {
      const val = resolveOutputValue(node.id, METRIC_PORT_ID, nodes, edgeIndex, new Set())
      if (val !== undefined) evalMap.set(`${node.id}:${METRIC_PORT_ID}`, val)
      unitMap.set(`${node.id}:${METRIC_PORT_ID}`, resolveUnit(node.id, METRIC_PORT_ID, nodes, edgeIndex, new Set()))
    }
  }

  return { evalMap, unitMap }
}
