/**
 * SimContext — Experiment / What-If Mode
 *
 * Provides a read-only overlay on top of the real graph evaluation. Underlying
 * node data is never mutated; all changes are discarded when simMode is toggled off.
 *
 * Constants/measures: the slider directly adjusts the port value via simOverlay.
 * Formula/metric nodes: the slider triggers back-propagation (see simBackPropagate.ts).
 */

import { createContext, useCallback, useContext, useState } from 'react'
import { useEdges, useNodes } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import type { FeedbackNodeData } from '../types/graph'
import { useEvalMap } from './GraphEvalContext'
import { useSimEvalMap } from './simForwardProp'
import { computeBackPropagateUpdates } from './simBackPropagate'

type EvalMap = Map<string, number>

interface SimContextValue {
  simMode: boolean
  toggleSimMode: () => void
  /** simOverlay keys: "nodeId:portId"  or  "nodeId:METRIC_PORT_ID" */
  simOverlay: Map<string, number>
  setSimValue: (key: string, value: number) => void
  removeSimValue: (key: string) => void
  clearSim: () => void
  /**
   * Back-propagate a target % change from a formula/metric node to its upstream
   * constants. nodeKey = "nodeId:portId" (or "nodeId:METRIC_PORT_ID"). targetPct is
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
    setSimOverlay(prev => { const next = new Map(prev); next.set(key, value); return next })
  }, [])

  const removeSimValue = useCallback((key: string) => {
    setSimOverlay(prev => { const next = new Map(prev); next.delete(key); return next })
  }, [])

  const { simEvalMap, deltaMap } = useSimEvalMap(simMode, simOverlay, nodes, edges, baseEvalMap)

  const backPropagate = useCallback((nodeKey: string, targetPct: number) => {
    const updates = computeBackPropagateUpdates(
      nodeKey, targetPct, nodes, edges, baseEvalMap, simEvalMap, simOverlay, lockedKeys
    )
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
