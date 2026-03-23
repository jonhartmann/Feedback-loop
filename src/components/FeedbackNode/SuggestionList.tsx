import type { FormulaBuiltin } from '../../utils/formulaEval'

export interface Suggestion {
  /** Text shown in the dropdown (e.g. "min(" or "revenue") */
  label: string
  /** Text inserted into the input */
  insert: string
  /** Secondary hint shown to the right (e.g. "min(a, b)") */
  secondary?: string
}

/** Returns the identifier fragment immediately left of `pos` and its start index. */
export function wordAtCursor(text: string, pos: number): { fragment: string; start: number } {
  let start = pos
  while (start > 0 && /\w/.test(text[start - 1])) start--
  const fragment = text.slice(start, pos)
  if (fragment && !/^[a-zA-Z_]/.test(fragment)) return { fragment: '', start: pos }
  return { fragment, start }
}

export function buildSuggestions(
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

  return [...varMatches, ...builtinMatches].slice(0, 10)
}

export function SuggestionList({
  suggestions,
  activeIndex,
  onSelect,
}: {
  suggestions: Suggestion[]
  activeIndex: number
  onSelect: (s: Suggestion) => void
}) {
  return (
    <ul className="formula-input-dropdown">
      {suggestions.map((s, i) => (
        <li
          key={s.insert + i}
          className={`formula-input-suggestion${i === activeIndex ? ' is-active' : ''}`}
          onMouseDown={e => e.preventDefault()}
          onClick={() => onSelect(s)}
        >
          <span className="formula-suggestion-name">{s.label}</span>
          {s.secondary && <span className="formula-suggestion-sig">{s.secondary}</span>}
        </li>
      ))}
    </ul>
  )
}
