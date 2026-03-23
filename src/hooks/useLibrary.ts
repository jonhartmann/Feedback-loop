import { useState, useEffect, useCallback } from 'react'
import type { LibraryItem } from '../types/graph'
import { DEFAULT_ITEMS } from '../data/defaultLibrary'

const STORAGE_KEY = 'feedback-loop-library'

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as LibraryItem[]
    } catch { /* ignore */ }
    return DEFAULT_ITEMS
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
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
