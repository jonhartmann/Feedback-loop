/**
 * Pure graph evaluation utilities.
 * Resolves numeric values and units through the node graph via recursive traversal.
 * Exported and reused by both GraphEvalContext and SimContext.
 */

import type { Node, Edge } from '@xyflow/react'
import type { FeedbackNodeData, Unit } from '../types/graph'
import { evalFormula, labelToVarName, dominantUnit } from './formulaEval'

type EvalMap = Map<string, number>
type UnitMap = Map<string, Unit>
// Key: "targetNodeId:targetHandle" → the incoming edge
export type EdgeIndex = Map<string, Edge>

export interface GraphEvalMaps {
  evalMap: EvalMap
  unitMap: UnitMap
}

/** Build the formula scope for a node from its resolved upstream inputs.
 * For each input port: prefer a connected edge value; fall back to port.value (measure-style ports). */
function buildInputScope(
  nodeId: string,
  data: FeedbackNodeData,
  nodes: Node<FeedbackNodeData>[],
  edgeIndex: EdgeIndex,
  visited: Set<string>,
): Record<string, number> {
  const scope: Record<string, number> = {}
  for (const input of data.inputs ?? []) {
    const edge = edgeIndex.get(`${nodeId}:${input.id}`)
    if (edge?.sourceHandle) {
      const val = resolveOutputValue(edge.source, edge.sourceHandle, nodes, edgeIndex, new Set(visited))
      if (val !== undefined) scope[labelToVarName(input.label)] = val
    } else if (input.value !== undefined) {
      scope[labelToVarName(input.label)] = input.value
    }
  }
  return scope
}

/** Resolve the numeric value of a specific output port. */
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

  const port = data.outputs?.find(p => p.id === portId)
  if (!port) return undefined

  // Direct value (constant nodes)
  if (port.value !== undefined && isFinite(port.value)) return port.value

  // Formula output — build scope from resolved upstream inputs
  if (port.formula) {
    const scope = buildInputScope(nodeId, data, nodes, edgeIndex, visited)
    const result = evalFormula(port.formula, scope)
    if (result.type === 'number') return result.value
  }

  return undefined
}

/** Resolve the display unit of an output port, using explicit setting or input inference. */
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

  const port = data.outputs?.find(p => p.id === portId)
  if (!port) return 'number'

  if (port.unit) return port.unit
  if (data.variant === 'constant') return 'number'

  return dominantUnit(
    (data.inputs ?? []).map(input => {
      const edge = edgeIndex.get(`${nodeId}:${input.id}`)
      if (!edge?.sourceHandle) return undefined
      return resolveUnit(edge.source, edge.sourceHandle, nodes, edgeIndex, new Set(visited))
    })
  )
}

/** Returns true for nodeId if that node is a measure or has any measure node upstream. */
export function buildHasMeasureMap(
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
): Map<string, boolean> {
  const incoming = new Map<string, string[]>()
  for (const e of edges) {
    const arr = incoming.get(e.target) ?? []
    arr.push(e.source)
    incoming.set(e.target, arr)
  }

  const memo = new Map<string, boolean>()

  function check(nodeId: string, visited: Set<string>): boolean {
    if (memo.has(nodeId)) return memo.get(nodeId)!
    if (visited.has(nodeId)) return false
    visited.add(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return false
    if (node.data.variant === 'measure') { memo.set(nodeId, true); return true }
    const result = (incoming.get(nodeId) ?? []).some(src => check(src, new Set(visited)))
    memo.set(nodeId, result)
    return result
  }

  const result = new Map<string, boolean>()
  for (const node of nodes) result.set(node.id, check(node.id, new Set()))
  return result
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
  }

  return { evalMap, unitMap }
}
