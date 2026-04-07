import type { Edge, Node } from '@xyflow/react'
import type { FeedbackNodeData } from '../types/graph'
import { buildEvalMapsWithIndex } from '../utils/graphEval'
import type { EdgeIndex } from '../utils/graphEval'

type EvalMap = Map<string, number>

type ConstantPort = { key: string; nodeId: string; portId: string }

function collectUpstreamConstants(
  nodeId: string,
  nodes: Node<FeedbackNodeData>[],
  edgeIndex: EdgeIndex,
  lockedKeys: Set<string>,
): ConstantPort[] {
  const upstreamConstants: ConstantPort[] = []
  const visited = new Set<string>()

  function walk(nId: string, pId: string) {
    const vk = `${nId}::${pId}`
    if (visited.has(vk)) return
    visited.add(vk)

    const node = nodes.find(n => n.id === nId)
    if (!node) return

    const key = `${nId}:${pId}`

    if (node.data.variant === 'constant' || node.data.variant === 'measure') {
      if (!lockedKeys.has(key)) upstreamConstants.push({ key, nodeId: nId, portId: pId })
      return
    }

    if (lockedKeys.has(key)) return

    for (const input of (node.data.inputs ?? [])) {
      const edge = edgeIndex.get(`${nId}:${input.id}`)
      if (edge?.sourceHandle) walk(edge.source, edge.sourceHandle)
    }
  }

  const thisNode = nodes.find(n => n.id === nodeId)
  if (!thisNode) return upstreamConstants
  for (const input of (thisNode.data.inputs ?? [])) {
    const edge = edgeIndex.get(`${nodeId}:${input.id}`)
    if (edge?.sourceHandle) walk(edge.source, edge.sourceHandle)
  }

  return upstreamConstants
}

/**
 * Compute the simOverlay updates required to back-propagate a target % change
 * from a formula/metric node to its upstream constants.
 *
 * Returns a Map of key → new fractional overlay value, or an empty Map if
 * back-propagation is not possible (zero base value, insensitive formula, etc.).
 */
export function computeBackPropagateUpdates(
  nodeKey: string,
  targetPct: number,
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
  baseEvalMap: EvalMap,
  simEvalMap: EvalMap,
  simOverlay: Map<string, number>,
  lockedKeys: Set<string>,
): Map<string, number> {
  const colonIdx = nodeKey.indexOf(':')
  const nodeId = nodeKey.slice(0, colonIdx)

  const baseVal = baseEvalMap.get(nodeKey)
  if (baseVal === undefined || !isFinite(baseVal) || baseVal === 0) return new Map()

  const currentSimVal = simEvalMap.get(nodeKey) ?? baseVal
  if (!isFinite(currentSimVal) || currentSimVal === 0) return new Map()

  const targetVal = baseVal * (1 + targetPct / 100)
  const factor = targetVal / currentSimVal
  if (!isFinite(factor) || factor === 0) return new Map()

  const edgeIndex: EdgeIndex = new Map()
  for (const e of edges) {
    if (e.targetHandle) edgeIndex.set(`${e.target}:${e.targetHandle}`, e)
  }

  const upstreamConstants = collectUpstreamConstants(nodeId, nodes, edgeIndex, lockedKeys)
  if (upstreamConstants.length === 0) return new Map()

  // ── Step 2: compute log-derivatives at the BASE point ───────────────────
  const ε = 0.001
  const logDerivs: number[] = []

  for (const { nodeId: cNId, portId: cPId } of upstreamConstants) {
    const constNode = nodes.find(n => n.id === cNId)
    if (!constNode) { logDerivs.push(0); continue }

    const tweakedNodes = nodes.map(n => {
      if (n.id !== cNId) return n

      if (n.data.variant === 'measure') {
        // Measure nodes: value lives on inputs[0]; perturb there
        const inputList = n.data.inputs ?? []
        let changed = false
        const newInputs = inputList.map(p => {
          if (p.id !== cPId) return p
          // cPId is the OUTPUT port id — for measure nodes, map to the input's value
          // We find the base value via evalMap since the output formula is identity
          const v = baseEvalMap.get(`${cNId}:${cPId}`) ?? 0
          if (v === 0) return p
          changed = true
          return { ...p, value: v * (1 + ε) }
        })
        // If the portId didn't match an input id directly, match via evalMap key
        if (!changed) {
          // Try matching the single source input (measure has exactly one)
          const sourceInput = inputList[0]
          if (sourceInput && sourceInput.value !== undefined && sourceInput.value !== 0) {
            const newInputs2 = inputList.map((p, i) =>
              i === 0 ? { ...p, value: p.value! * (1 + ε) } : p
            )
            return { ...n, data: { ...n.data, inputs: newInputs2 } }
          }
          return n
        }
        return changed ? { ...n, data: { ...n.data, inputs: newInputs } } : n
      }

      // Constant nodes: value lives on outputs
      const outputList = n.data.outputs ?? []
      let changed = false
      const newOutputs = outputList.map(p => {
        if (p.id !== cPId) return p
        const v = (p.value !== undefined && isFinite(p.value)) ? p.value : 0
        if (v === 0) return p
        changed = true
        return { ...p, value: v * (1 + ε), formula: undefined }
      })
      return changed ? { ...n, data: { ...n.data, outputs: newOutputs } } : n
    })

    const { evalMap: tweaked } = buildEvalMapsWithIndex(tweakedNodes, edgeIndex)
    const fPerturbed = tweaked.get(nodeKey) ?? baseVal
    logDerivs.push((fPerturbed - baseVal) / (baseVal * ε))
  }

  // ── Step 3: distribute the factor using sensitivity-weighted exponents ──
  const totalAbsSens = logDerivs.reduce((s, d) => s + Math.abs(d), 0)
  if (totalAbsSens < 1e-9) return new Map()

  const updates = new Map<string, number>()

  for (let i = 0; i < upstreamConstants.length; i++) {
    const { key, nodeId: cNId, portId: cPId } = upstreamConstants[i]
    const d = logDerivs[i]
    if (Math.abs(d) < 1e-9) continue

    const constNode = nodes.find(n => n.id === cNId)
    if (!constNode) continue

    let liveBase: number
    if (constNode.data.variant === 'measure') {
      // For measure nodes, base value comes from evalMap (identity formula)
      liveBase = baseEvalMap.get(key) ?? 0
    } else {
      const portObj = (constNode.data.outputs ?? []).find(p => p.id === cPId)
      liveBase = (portObj?.value !== undefined && isFinite(portObj.value))
        ? portObj.value
        : (baseEvalMap.get(key) ?? 0)
    }
    if (liveBase === 0) continue

    const exponent = Math.sign(d) / totalAbsSens
    const inputFactor = Math.pow(factor, exponent)

    const currentFraction = simOverlay.get(key) ?? 0
    const currentSim = liveBase * (1 + currentFraction)
    const newSim = currentSim * inputFactor
    updates.set(key, newSim / liveBase - 1)
  }

  return updates
}
