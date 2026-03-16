import { evaluate } from 'mathjs'
import type { NodeVariable } from '../types/graph'

export type EvalResult =
  | { type: 'number'; value: number }
  | { type: 'symbolic' }             // valid but some vars have no value (normal for diagrams)
  | { type: 'error'; message: string }

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
    const result = evaluate(formula, { ...scope })
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
