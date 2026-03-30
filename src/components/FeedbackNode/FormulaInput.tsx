import { useState, useRef } from 'react'
import type { FormulaBuiltin } from '../../utils/formulaEval'
import { useDraftValue } from '../../hooks/useDraftValue'
import { SuggestionList, wordAtCursor, buildSuggestions } from './SuggestionList'
import type { Suggestion } from './SuggestionList'

interface FormulaInputProps {
  value: string
  onChange: (v: string) => void
  variables: string[]
  builtins?: FormulaBuiltin[]
  placeholder?: string
  className?: string
  /** Applied to the outer wrapper div (use for layout: flex, width, etc.) */
  wrapperStyle?: React.CSSProperties
  /** Applied to the inner input element (use for appearance overrides) */
  inputStyle?: React.CSSProperties
  onMouseDown?: (e: React.MouseEvent) => void
}

export default function FormulaInput({
  value, onChange, variables, builtins = [],
  placeholder, className, wrapperStyle, inputStyle, onMouseDown,
}: FormulaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const { draft: localValue, setDraft: setLocalValue, focusedRef } = useDraftValue(value)

  function updateSuggestions(text: string, pos: number) {
    const { fragment } = wordAtCursor(text, pos)
    if (!fragment) { setOpen(false); return }
    const matches = buildSuggestions(fragment, variables, builtins)
    setSuggestions(matches)
    setActiveIndex(0)
    setOpen(matches.length > 0)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setLocalValue(v)
    onChange(v)
    updateSuggestions(v, e.target.selectionStart ?? v.length)
  }

  function insertCompletion(suggestion: Suggestion) {
    const input = inputRef.current
    if (!input) return
    const pos = input.selectionStart ?? localValue.length
    const { start } = wordAtCursor(localValue, pos)
    const patched = localValue.slice(0, start) + suggestion.insert + localValue.slice(pos)
    setLocalValue(patched)
    onChange(patched)
    setOpen(false)
    setSuggestions([])
    const newCursorPos = start + suggestion.insert.length
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (suggestions[activeIndex] !== undefined) {
        e.preventDefault()
        insertCompletion(suggestions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="formula-input-wrapper" style={wrapperStyle}>
      <input
        ref={inputRef}
        className={className}
        value={localValue}
        placeholder={placeholder}
        style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', ...inputStyle }}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { focusedRef.current = true }}
        onBlur={() => { focusedRef.current = false; setOpen(false) }}
        onMouseDown={onMouseDown}
      />
      {open && (
        <SuggestionList
          suggestions={suggestions}
          activeIndex={activeIndex}
          onSelect={insertCompletion}
        />
      )}
    </div>
  )
}
