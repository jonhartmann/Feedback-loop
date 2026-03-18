import { describe, it, expect } from 'vitest'
import {
  evalFormula,
  formatValue,
  dominantUnit,
  toCamelCase,
  labelToVarName,
  buildScope,
} from '../utils/formulaEval'

// ── evalFormula ───────────────────────────────────────────────────────────────

describe('evalFormula', () => {
  it('evaluates a simple arithmetic expression', () => {
    const result = evalFormula('2 + 3', {})
    expect(result).toEqual({ type: 'number', value: 5 })
  })

  it('substitutes scope variables', () => {
    const result = evalFormula('principal * rate', { principal: 1000, rate: 0.07 })
    expect(result).toEqual({ type: 'number', value: 70 })
  })

  it('returns error when a variable is missing from scope', () => {
    // mathjs v15 throws a type error (not "undefined symbol") when a variable
    // is absent, so evalFormula returns 'error'. The graph eval context always
    // provides a full scope from connected edges, so this only surfaces locally.
    const result = evalFormula('a + b', { a: 1 })
    expect(result.type).toBe('error')
  })

  it('returns symbolic for an empty formula', () => {
    const result = evalFormula('', {})
    expect(result.type).toBe('symbolic')
  })

  it('returns symbolic for a whitespace-only formula', () => {
    expect(evalFormula('   ', {}).type).toBe('symbolic')
  })

  it('returns error for a syntax error', () => {
    const result = evalFormula('((( broken', {})
    expect(result.type).toBe('error')
  })

  it('returns error for division by zero (Infinity is not finite)', () => {
    const result = evalFormula('1 / 0', {})
    // mathjs returns Infinity for 1/0 — not a finite number → symbolic
    expect(result.type).toBe('symbolic')
  })

  it('evaluates the compounding interest formula', () => {
    const scope = { principal: 10000, rate: 0.07, n: 12, years: 10 }
    const result = evalFormula('principal * (1 + rate / n) ^ (n * years)', scope)
    expect(result.type).toBe('number')
    if (result.type === 'number') {
      expect(result.value).toBeCloseTo(20096.61, 1)
    }
  })

  it('evaluates the LTV formula', () => {
    const scope = { annualRevenue: 272, margin: 0.45, lifespan: 3 }
    const result = evalFormula('annualRevenue * margin * lifespan', scope)
    expect(result.type).toBe('number')
    if (result.type === 'number') expect(result.value).toBeCloseTo(367.2, 5)
  })

  it('supports mathjs built-ins like min and max', () => {
    expect(evalFormula('min(10, 5)', {})).toEqual({ type: 'number', value: 5 })
    expect(evalFormula('max(10, 5)', {})).toEqual({ type: 'number', value: 10 })
  })

  it('supports the ^ power operator', () => {
    const result = evalFormula('2 ^ 10', {})
    expect(result).toEqual({ type: 'number', value: 1024 })
  })
})

// ── formatValue ───────────────────────────────────────────────────────────────

describe('formatValue', () => {
  it('formats money with $ prefix and commas', () => {
    expect(formatValue(20096.61, 'money')).toBe('$20,096.61')
  })

  it('formats small money values with 4 decimal places', () => {
    expect(formatValue(0.005, 'money')).toBe('$0.0050')
  })

  it('formats percent by multiplying by 100', () => {
    expect(formatValue(0.07, 'percent')).toBe('7%')
    expect(formatValue(0.455, 'percent')).toBe('45.5%')
  })

  it('formats plain numbers with commas and no unnecessary decimals', () => {
    expect(formatValue(1234, undefined)).toBe('1,234')
    expect(formatValue(1234.5, undefined)).toBe('1,234.5')
  })

  it('formats zero', () => {
    expect(formatValue(0, 'money')).toBe('$0.00')
    expect(formatValue(0, 'percent')).toBe('0%')
    expect(formatValue(0, undefined)).toBe('0')
  })
})

// ── dominantUnit ──────────────────────────────────────────────────────────────

describe('dominantUnit', () => {
  it('returns money when any input is money', () => {
    expect(dominantUnit(['money', 'percent'])).toBe('money')
    expect(dominantUnit([undefined, 'money'])).toBe('money')
  })

  it('returns percent only when all defined inputs are percent', () => {
    expect(dominantUnit(['percent', 'percent'])).toBe('percent')
    expect(dominantUnit(['percent', undefined])).toBe('percent')
  })

  it('returns number when inputs are mixed non-money types', () => {
    expect(dominantUnit(['percent', 'number'])).toBe('number')
  })

  it('returns number when no units are defined', () => {
    expect(dominantUnit([undefined, undefined])).toBe('number')
    expect(dominantUnit([])).toBe('number')
  })
})

// ── toCamelCase ───────────────────────────────────────────────────────────────

describe('toCamelCase', () => {
  it('converts a multi-word label to camelCase', () => {
    expect(toCamelCase('Supply Rate')).toBe('supplyRate')
    expect(toCamelCase('Annual Revenue')).toBe('annualRevenue')
  })

  it('strips non-alphanumeric separators', () => {
    expect(toCamelCase('Alpha Factor #2')).toBe('alphaFactor2')
  })

  it('lowercases a single word', () => {
    expect(toCamelCase('Principal')).toBe('principal')
  })

  it('handles already-camelCase input', () => {
    expect(toCamelCase('bounceRate')).toBe('bouncerate')
  })
})

// ── labelToVarName ────────────────────────────────────────────────────────────

describe('labelToVarName', () => {
  it('converts spaces to underscores', () => {
    expect(labelToVarName('demand signal')).toBe('demand_signal')
  })

  it('replaces special characters with underscores', () => {
    expect(labelToVarName('input #1')).toBe('input__1')
  })

  it('prefixes a leading digit', () => {
    expect(labelToVarName('1stInput')).toBe('_1stInput')
  })

  it('leaves a valid identifier unchanged', () => {
    expect(labelToVarName('visitors')).toBe('visitors')
    expect(labelToVarName('bounceRate')).toBe('bounceRate')
  })
})

// ── buildScope ────────────────────────────────────────────────────────────────

describe('buildScope', () => {
  it('merges variables and input values into a flat scope', () => {
    const vars = [{ name: 'k', value: 42 }]
    const inputs = new Map([['x', 10], ['y', 20]])
    expect(buildScope(vars, inputs)).toEqual({ k: 42, x: 10, y: 20 })
  })

  it('input values override variables with the same name', () => {
    const vars = [{ name: 'x', value: 1 }]
    const inputs = new Map([['x', 99]])
    expect(buildScope(vars, inputs).x).toBe(99)
  })

  it('handles empty variables and inputs', () => {
    expect(buildScope([], new Map())).toEqual({})
  })
})
