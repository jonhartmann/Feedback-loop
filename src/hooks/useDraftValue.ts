import { useState, useRef, useEffect } from 'react'

/**
 * Maintains a local draft string for an input that is controlled by an external value.
 * While the input is focused, the draft is shown (allowing the user to type freely).
 * When focus is lost, the draft syncs back from the external value.
 *
 * This prevents cursor-jump issues caused by parent re-renders resetting the input value
 * while the user is mid-edit.
 */
export function useDraftValue(externalValue: string | number) {
  const [draft, setDraft] = useState(String(externalValue))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setDraft(String(externalValue))
  }, [externalValue])

  return { draft, setDraft, focusedRef }
}
