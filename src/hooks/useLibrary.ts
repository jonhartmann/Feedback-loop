import { useState, useEffect, useCallback } from 'react'
import type { LibraryItem, NodeTemplate, OutputPort } from '../types/graph'
import { METRIC_PORT_ID } from '../types/graph'
import { DEFAULT_ITEMS } from '../data/defaultLibrary'
import { toCamelCase, labelToVarName } from '../utils/formulaEval'

const STORAGE_KEY = 'feedback-loop-library'
const VERSION_KEY = 'feedback-loop-library-version'
const CURRENT_VERSION = 2  // bump when library schema changes

/** Migrate a single library item from any older schema to the current one. */
function migrateItem(item: LibraryItem): LibraryItem {
  const t = item.template as NodeTemplate & Record<string, unknown>

  if (t.variant === 'measure' && !t.inputs?.length) {
    // Old format: sourceUrl was a top-level NodeTemplate field
    const sourceUrl = t.sourceUrl as string | undefined
    const portLabel = toCamelCase(item.label) || 'value'
    const migratedTemplate: NodeTemplate = {
      label: t.label,
      variant: 'measure',
      inputs: [{ id: 'src', label: portLabel, ...(sourceUrl ? { sourceUrl } : {}) }],
      outputs: [{ id: 'out', label: portLabel, formula: labelToVarName(portLabel) }],
      ...(t.displayMode     ? { displayMode: t.displayMode as 'value' | 'series' }           : {}),
      ...(t.seriesChartType ? { seriesChartType: t.seriesChartType as 'line'|'area'|'bar' }   : {}),
    }
    if (t.outputs?.[0]?.unit) (migratedTemplate.outputs as OutputPort[])[0].unit = (t.outputs[0] as OutputPort).unit
    return { ...item, template: migratedTemplate }
  }

  if (t.variant === 'metric' && !t.outputs?.some((p: OutputPort) => p.id === METRIC_PORT_ID)) {
    // Old format: metricFormula/metricUnit were top-level NodeTemplate fields
    const formula = t.metricFormula as string | undefined
    const unit    = t.metricUnit as 'money' | 'percent' | undefined
    const metricPort: OutputPort = { id: METRIC_PORT_ID, label: 'value', ...(formula ? { formula } : {}), ...(unit ? { unit } : {}) }
    return { ...item, template: { ...t, outputs: [metricPort] } as NodeTemplate }
  }

  return item
}

function loadItems(): LibraryItem[] {
  try {
    const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) ?? '0', 10)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ITEMS
    const parsed = JSON.parse(raw) as LibraryItem[]
    if (storedVersion < CURRENT_VERSION) {
      return parsed.map(migrateItem)
    }
    return parsed
  } catch {
    return DEFAULT_ITEMS
  }
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>(loadItems)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION))
  }, [items])

  const addItem = useCallback((item: Omit<LibraryItem, 'id'>) => {
    setItems(prev => [...prev, { ...item, id: crypto.randomUUID() }])
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<Omit<LibraryItem, 'id'>>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const resetToDefaults = useCallback(() => {
    setItems(DEFAULT_ITEMS)
  }, [])

  return { items, addItem, updateItem, removeItem, resetToDefaults }
}
