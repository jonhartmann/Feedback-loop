import { useEffect, useRef } from 'react'

export function useEscapeKey(onEscape: () => void) {
  const ref = useRef(onEscape)
  useEffect(() => { ref.current = onEscape })
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') ref.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
