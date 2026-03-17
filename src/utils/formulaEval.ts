import { create, all } from 'mathjs'
import type { NodeVariable, Unit } from '../types/graph'

// Restricted mathjs instance — disables side-effectful operations
const math = create(all)
// Capture evaluate BEFORE overriding anything
const safeEvaluate = math.evaluate
math.import({
  import:     () => { throw new Error('disabled') },
  createUnit: () => { throw new Error('disabled') },
  simplify:   () => { throw new Error('disabled') },
  derivative: () => { throw new Error('disabled') },
}, { override: true })

// ── Built-in function catalogue ───────────────────────────────────────────────

export interface FormulaBuiltin {
  /** Identifier used for autocomplete matching */
  name: string
  /** Human-readable signature shown in dropdown */
  display: string
  /** If true, complete as bare name without appending '(' */
  isConstant?: boolean
}

export const FORMULA_BUILTINS: FormulaBuiltin[] = [
  // Comparison
  { name: 'min',      display: 'min(a, b)' },
  { name: 'max',      display: 'max(a, b)' },
  // Arithmetic
  { name: 'abs',      display: 'abs(x)' },
  { name: 'sqrt',     display: 'sqrt(x)' },
  { name: 'pow',      display: 'pow(x, n)' },
  { name: 'mod',      display: 'mod(a, b)' },
  { name: 'sign',     display: 'sign(x)' },
  // Rounding
  { name: 'round',    display: 'round(x)' },
  { name: 'floor',    display: 'floor(x)' },
  { name: 'ceil',     display: 'ceil(x)' },
  // Logarithm / exponential
  { name: 'log',      display: 'log(x, base?)' },
  { name: 'log2',     display: 'log2(x)' },
  { name: 'log10',    display: 'log10(x)' },
  { name: 'exp',      display: 'exp(x)' },
  // Aggregation
  { name: 'sum',      display: 'sum(a, b, ...)' },
  { name: 'mean',     display: 'mean(a, b, ...)' },
  // Conditional
  { name: 'if',       display: 'if(cond, then, else)' },
  // Trigonometry
  { name: 'sin',      display: 'sin(x)' },
  { name: 'cos',      display: 'cos(x)' },
  { name: 'tan',      display: 'tan(x)' },
  { name: 'atan2',    display: 'atan2(y, x)' },
  // Constants
  { name: 'pi',       display: 'pi  (3.14159…)',  isConstant: true },
  { name: 'e',        display: 'e   (2.71828…)',  isConstant: true },
  { name: 'Infinity', display: 'Infinity',        isConstant: true },
]

export type { Unit }

/**
 * Determine decimal places for display:
 * - |value| >= 0.01 → 2 decimal places
 * - 0 < |value| < 0.01 → 4 decimal places (preserve small values)
 */
function decimalPlaces(value: number): number {
  const abs = Math.abs(value)
  return (abs > 0 && abs < 0.01) ? 4 : 2
}

/**
 * Format a bare number with commas and smart decimal places.
 * Pass `forceDecimals: true` to always show the minimum decimal digits (e.g. for money).
 */
function formatNumber(value: number, forceDecimals = false): string {
  const dp = decimalPlaces(value)
  return value.toLocaleString('en-US', {
    minimumFractionDigits: forceDecimals ? dp : 0,
    maximumFractionDigits: dp,
  })
}

/**
 * Format a numeric value for display according to its unit.
 * `money`   → $1,234.56  (always shows cents; 4dp for values <0.01)
 * `percent` → 42.5%      (stored as decimal 0.425; multiplied by 100 for display)
 * `number`  → 1,234.5    (commas; no trailing zeros; 4dp for values <0.01)
 */
export function formatValue(value: number, unit: Unit | undefined): string {
  switch (unit) {
    case 'money':   return `$${formatNumber(value, true)}`
    case 'percent': return `${formatNumber(value * 100)}%`
    default:        return formatNumber(value)
  }
}

/**
 * Infer the dominant unit from a set of input units.
 * - money beats everything
 * - percent only propagates when ALL defined inputs are percent
 *   (mixing percent with number produces a dimensionless number, not a percent)
 */
export function dominantUnit(units: (Unit | undefined)[]): Unit {
  const defined = units.filter((u): u is Unit => !!u)
  if (defined.includes('money')) return 'money'
  if (defined.length > 0 && defined.every(u => u === 'percent')) return 'percent'
  return 'number'
}

export type EvalResult =
  | { type: 'number'; value: number }
  | { type: 'symbolic' }             // valid but some vars have no value (normal for diagrams)
  | { type: 'error'; message: string }

/**
 * Convert a node label to a camelCase identifier.
 * "Supply Rate" → "supplyRate"
 * "Alpha Factor #2" → "alphaFactor2"
 */
export function toCamelCase(label: string): string {
  const words = label.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean)
  return words
    .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

/**
 * Convert a port label to a valid mathjs identifier.
 * "demand signal" → "demand_signal"
 * "input #1"      → "input__1"
 */
export function labelToVarName(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
}

/**
 * Build a scope from node-level variables and optional input port values.
 * inputValues is keyed by labelToVarName(port.label).
 */
export function buildScope(
  variables: NodeVariable[],
  inputValues: Map<string, number>
): Record<string, number> {
  const scope: Record<string, number> = {}
  for (const v of variables) scope[v.name] = v.value
  for (const [k, v] of inputValues) scope[k] = v
  return scope
}

/**
 * Evaluate a formula string against a scope. Never throws.
 */
export function evalFormula(
  formula: string,
  scope: Record<string, number>
): EvalResult {
  if (!formula.trim()) return { type: 'symbolic' }
  try {
    const result = safeEvaluate(formula, { ...scope })
    if (typeof result === 'number' && isFinite(result)) {
      return { type: 'number', value: result }
    }
    return { type: 'symbolic' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Missing variable = expected in diagram mode, not an error
    if (msg.toLowerCase().includes('undefined symbol')) return { type: 'symbolic' }
    return { type: 'error', message: msg }
  }
}
