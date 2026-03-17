import { createContext, useContext } from 'react'
import type { LibraryItem } from '../types/graph'

export interface LibraryContextValue {
  items: LibraryItem[]
  addItem: (item: Omit<LibraryItem, 'id'>) => void
  updateItem: (id: string, updates: Partial<Omit<LibraryItem, 'id'>>) => void
  removeItem: (id: string) => void
  resetToDefaults: () => void
}

export const LibraryContext = createContext<LibraryContextValue | null>(null)

export function useLibraryContext(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibraryContext must be used within LibraryContext.Provider')
  return ctx
}
