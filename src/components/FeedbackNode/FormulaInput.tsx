import { useState, useRef } from 'react'
import type { FormulaBuiltin } from '../../utils/formulaEval'

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

interface Suggestion {
  /** Text shown in the dropdown (e.g. "min(" or "revenue") */
  label: string
  /** Text inserted into the input */
  insert: string
  /** Secondary hint shown to the right (e.g. "min(a, b)") */
  secondary?: string
}

/** Returns the identifier fragment immediately left of `pos` and its start index. */
function wordAtCursor(text: string, pos: number): { fragment: string; start: number } {
  let start = pos
  while (start > 0 && /\w/.test(text[start - 1])) start--
  const fragment = text.slice(start, pos)
  // Only treat it as a variable fragment if it starts with a letter or underscore
  if (fragment && !/^[a-zA-Z_]/.test(fragment)) return { fragment: '', start: pos }
  return { fragment, start }
}

function buildSuggestions(
  fragment: string,
  variables: string[],
  builtins: FormulaBuiltin[],
): Suggestion[] {
  if (!fragment) return []

  const varMatches: Suggestion[] = variables
    .filter(v => v.startsWith(fragment) && v !== fragment)
    .slice(0, 5)
    .map(v => ({ label: v, insert: v }))

  const builtinMatches: Suggestion[] = builtins
    .filter(b => b.name.startsWith(fragment) && b.name !== fragment)
    .slice(0, 5)
    .map(b => ({
      label: b.isConstant ? b.name : `${b.name}(`,
      insert: b.isConstant ? b.name : `${b.name}(`,
      secondary: b.display,
    }))

  // Variables first, then builtins; cap total at 10
  return [...varMatches, ...builtinMatches].slice(0, 10)
}

export default function FormulaInput({
  value, onChange, variables, builtins = [],
  placeholder, className, wrapperStyle, inputStyle, onMouseDown,
}: FormulaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  function updateSuggestions(text: string, pos: number) {
    const { fragment } = wordAtCursor(text, pos)
    if (!fragment) { setOpen(false); return }
    const matches = buildSuggestions(fragment, variables, builtins)
    setSuggestions(matches)
    setActiveIndex(0)
    setOpen(matches.length > 0)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
    updateSuggestions(e.target.value, e.target.selectionStart ?? e.target.value.length)
  }

  function insertCompletion(suggestion: Suggestion) {
    const input = inputRef.current
    if (!input) return
    const pos = input.selectionStart ?? value.length
    const { start } = wordAtCursor(value, pos)
    const patched = value.slice(0, start) + suggestion.insert + value.slice(pos)
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
        value={value}
        placeholder={placeholder}
        style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', ...inputStyle }}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        onMouseDown={onMouseDown}
      />
      {open && (
        <ul className="formula-input-dropdown">
          {suggestions.map((s, i) => (
            <li
              key={s.insert + i}
              className={`formula-input-suggestion${i === activeIndex ? ' is-active' : ''}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => insertCompletion(s)}
            >
              <span className="formula-suggestion-name">{s.label}</span>
              {s.secondary && <span className="formula-suggestion-sig">{s.secondary}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
