/**
 * SimContext — Experiment / What-If Mode
 *
 * Provides a read-only overlay on top of the real graph evaluation. Underlying
 * node data is never mutated; all changes are discarded when simMode is toggled off.
 *
 * Constants/measures: the slider directly adjusts the port value via simOverlay.
 *
 * Formula/metric nodes: the slider triggers BACK-PROPAGATION.
 *
 * Back-propagation algorithm:
 *   1. Walk the dependency graph to collect every upstream constant/measure port.
 *   2. For each constant, numerically perturb it by ε% and re-evaluate the target
 *      node to compute its log-derivative (elasticity): Δ_target / Δ_input.
 *      - Multiplication: elasticity ≈ +1 per term
 *      - Division denominator: elasticity ≈ −1
 *      - Additive inputs: elasticity proportional to relative magnitude
 *   3. Apply the required overall factor as factor^(sign(e_i) / Σ|e_i|) to each
 *      constant. For purely multiplicative chains this lands exactly on the target;
 *      for other formulas it is a well-behaved approximation.
 *
 * This avoids the "going crazy" problem where naively scaling all N constants by
 * the same factor compounds to factor^N for multiplicative formulas.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useEdges, useNodes } from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import type { FeedbackNodeData } from '../types/graph'
import { useEvalMap, useUnitMap, buildEvalMaps } from './GraphEvalContext'

type EvalMap = Map<string, number>

interface SimContextValue {
  simMode: boolean
  toggleSimMode: () => void
  /** simOverlay keys: "nodeId:portId"  or  "nodeId:__metric" */
  simOverlay: Map<string, number>
  setSimValue: (key: string, value: number) => void
  removeSimValue: (key: string) => void
  clearSim: () => void
  /**
   * Back-propagate a target % change from a formula/metric node to its upstream
   * constants. nodeKey = "nodeId:portId" (or "nodeId:__metric"). targetPct is
   * relative to the BASE value (e.g. 20 = "make this 20% above its base value").
   * Locked constants are excluded — only unlocked constants absorb the change.
   */
  backPropagate: (nodeKey: string, targetPct: number) => void
  /**
   * Keys of constant/measure ports that are locked and will not be altered by
   * back-propagation. Format: "nodeId:portId".
   */
  lockedKeys: Set<string>
  toggleLock: (key: string) => void
  /** Forward-evaluated map using simulated values */
  simEvalMap: EvalMap
  /** simEvalMap[k] − baseEvalMap[k] for every key that has changed */
  deltaMap: Map<string, number>
}

const SimContext = createContext<SimContextValue>({
  simMode: false,
  toggleSimMode: () => {},
  simOverlay: new Map(),
  setSimValue: () => {},
  removeSimValue: () => {},
  clearSim: () => {},
  backPropagate: () => {},
  lockedKeys: new Set(),
  toggleLock: () => {},
  simEvalMap: new Map(),
  deltaMap: new Map(),
})

export function useSimContext(): SimContextValue {
  return useContext(SimContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SimProvider({ children }: { children: React.ReactNode }) {
  const nodes = useNodes() as Node<FeedbackNodeData>[]
  const edges = useEdges()
  const baseEvalMap = useEvalMap()
  const unitMap = useUnitMap()

  // Unused but kept for interface stability
  void unitMap

  const [simMode, setSimMode] = useState(false)
  const [simOverlay, setSimOverlay] = useState<Map<string, number>>(new Map())
  const [lockedKeys, setLockedKeys] = useState<Set<string>>(new Set())

  const toggleSimMode = useCallback(() => {
    setSimMode(m => !m)
    setSimOverlay(new Map())
    setLockedKeys(new Set())
  }, [])

  const toggleLock = useCallback((key: string) => {
    setLockedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const clearSim = useCallback(() => setSimOverlay(new Map()), [])

  const setSimValue = useCallback((key: string, value: number) => {
    setSimOverlay(prev => {
      const next = new Map(prev)
      next.set(key, value)
      return next
    })
  }, [])

  const removeSimValue = useCallback((key: string) => {
    setSimOverlay(prev => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  // ── Forward propagation ────────────────────────────────────────────────────
  // simOverlay stores FRACTIONAL adjustments (e.g. 0.20 = +20%), NOT absolute values.
  // The absolute sim value is always computed as: currentLiveBase * (1 + adjustment).
  // This means a +20% adjustment tracks live series data automatically — the base
  // keeps updating while the percentage stays fixed.

  const { simEvalMap, deltaMap } = useMemo(() => {
    if (!simMode || simOverlay.size === 0) {
      return { simEvalMap: baseEvalMap, deltaMap: new Map<string, number>() }
    }

    const simNodes = nodes.map(node => {
      const newOutputs = (node.data.outputs ?? []).map(port => {
        const pctAdj = simOverlay.get(`${node.id}:${port.id}`)
        if (pctAdj === undefined) return port
        const liveBase = (port.value !== undefined && isFinite(port.value))
          ? port.value
          : (baseEvalMap.get(`${node.id}:${port.id}`) ?? 0)
        return { ...port, value: liveBase * (1 + pctAdj), formula: undefined }
      })
      if (newOutputs.every((p, i) => p === (node.data.outputs ?? [])[i])) return node
      return { ...node, data: { ...node.data, outputs: newOutputs } }
    })

    const { evalMap: rawSimEvalMap } = buildEvalMaps(simNodes, edges)

    // Metric outputs aren't formula ports — apply fractional override post-hoc
    for (const node of nodes) {
      if (node.data.variant === 'metric') {
        const pctAdj = simOverlay.get(`${node.id}:__metric`)
        if (pctAdj !== undefined) {
          const liveBase = baseEvalMap.get(`${node.id}:__metric`) ?? 0
          rawSimEvalMap.set(`${node.id}:__metric`, liveBase * (1 + pctAdj))
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

  // ── Back-propagation ────────────────────────────────────────────────────────

  const backPropagate = useCallback((nodeKey: string, targetPct: number) => {
    const colonIdx = nodeKey.indexOf(':')
    const nodeId = nodeKey.slice(0, colonIdx)

    const baseVal = baseEvalMap.get(nodeKey)
    if (baseVal === undefined || !isFinite(baseVal) || baseVal === 0) return

    // Use the current sim value so repeated drags compose from where we are now,
    // not always from scratch relative to the base.
    const currentSimVal = simEvalMap.get(nodeKey) ?? baseVal
    if (!isFinite(currentSimVal) || currentSimVal === 0) return

    const targetVal = baseVal * (1 + targetPct / 100)
    const factor = targetVal / currentSimVal
    if (!isFinite(factor) || factor === 0) return

    // ── Step 1: collect every upstream constant/measure port ────────────────
    type ConstantPort = { key: string; nodeId: string; portId: string }
    const upstreamConstants: ConstantPort[] = []
    const visited = new Set<string>()

    function collectConstants(nId: string, pId: string) {
      const vk = `${nId}::${pId}`
      if (visited.has(vk)) return
      visited.add(vk)

      const node = nodes.find(n => n.id === nId)
      if (!node) return

      const key = `${nId}:${pId}`

      if (node.data.variant === 'constant' || node.data.variant === 'measure') {
        // Locked constants hold their value — skip them
        if (!lockedKeys.has(key)) {
          upstreamConstants.push({ key, nodeId: nId, portId: pId })
        }
        return
      }

      // Formula/metric node — if locked, treat as fixed and stop traversal
      if (lockedKeys.has(key)) return

      for (const input of (node.data.inputs ?? [])) {
        const edge = (edges as Edge[]).find(e => e.target === nId && e.targetHandle === input.id)
        if (edge?.sourceHandle) collectConstants(edge.source, edge.sourceHandle)
      }
    }

    const thisNode = nodes.find(n => n.id === nodeId)
    if (!thisNode) return
    for (const input of (thisNode.data.inputs ?? [])) {
      const edge = (edges as Edge[]).find(e => e.target === nodeId && e.targetHandle === input.id)
      if (edge?.sourceHandle) collectConstants(edge.source, edge.sourceHandle)
    }

    if (upstreamConstants.length === 0) return

    // ── Step 2: compute log-derivatives at the BASE point ───────────────────
    // Perturb each upstream constant by ε% and measure how much the target moves.
    // log-derivative (elasticity) = (Δf/f) / (Δx/x)
    // Computed at the base point; signs are stable for monotone formulas.
    const ε = 0.001
    const logDerivs: number[] = []

    for (const { nodeId: cNId, portId: cPId } of upstreamConstants) {
      const tweakedNodes = nodes.map(n => {
        if (n.id !== cNId) return n
        const newOutputs = (n.data.outputs ?? []).map(p => {
          if (p.id !== cPId) return p
          const v = (p.value !== undefined && isFinite(p.value)) ? p.value : 0
          if (v === 0) return p
          return { ...p, value: v * (1 + ε), formula: undefined }
        })
        if (newOutputs.every((p, i) => p === (n.data.outputs ?? [])[i])) return n
        return { ...n, data: { ...n.data, outputs: newOutputs } }
      })

      const { evalMap: tweaked } = buildEvalMaps(tweakedNodes, edges)
      const fPerturbed = tweaked.get(nodeKey) ?? baseVal
      // Elasticity relative to base (not current sim — signs are stable)
      logDerivs.push((fPerturbed - baseVal) / (baseVal * ε))
    }

    // ── Step 3: distribute the factor using sensitivity-weighted exponents ──
    // For purely multiplicative chains: all elasticities = ±1 → exact result.
    // General case: each input scales by factor^(sign(e_i) / Σ|e_i|).
    const totalAbsSens = logDerivs.reduce((s, d) => s + Math.abs(d), 0)
    if (totalAbsSens < 1e-9) return  // formula is insensitive to all inputs

    const updates = new Map<string, number>()

    for (let i = 0; i < upstreamConstants.length; i++) {
      const { key, nodeId: cNId, portId: cPId } = upstreamConstants[i]
      const d = logDerivs[i]
      if (Math.abs(d) < 1e-9) continue  // this constant doesn't affect the target

      const constNode = nodes.find(n => n.id === cNId)
      if (!constNode) continue

      const portObj = (constNode.data.outputs ?? []).find(p => p.id === cPId)
      const liveBase = (portObj?.value !== undefined && isFinite(portObj.value))
        ? portObj.value
        : (baseEvalMap.get(key) ?? 0)
      if (liveBase === 0) continue

      // This constant's required scaling: factor^(sign(d) / Σ|e|)
      const exponent = Math.sign(d) / totalAbsSens
      const inputFactor = Math.pow(factor, exponent)

      // Compose with existing overlay (so repeated drags accumulate correctly)
      const currentFraction = simOverlay.get(key) ?? 0
      const currentSim = liveBase * (1 + currentFraction)
      const newSim = currentSim * inputFactor
      updates.set(key, newSim / liveBase - 1)
    }

    if (updates.size > 0) {
      setSimOverlay(prev => {
        const next = new Map(prev)
        for (const [key, fraction] of updates) next.set(key, fraction)
        return next
      })
    }
  }, [nodes, edges, baseEvalMap, simEvalMap, simOverlay, lockedKeys])

  const value: SimContextValue = {
    simMode, toggleSimMode,
    simOverlay, setSimValue, removeSimValue, clearSim,
    backPropagate,
    lockedKeys, toggleLock,
    simEvalMap, deltaMap,
  }

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>
}
