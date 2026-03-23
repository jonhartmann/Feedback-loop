import type { Unit } from '../../types/graph'

/** Returns the CSS modifier class for a given unit (includes leading space for template literals). */
export function unitClass(u: Unit | undefined): string {
  return u === 'money' ? ' is-money' : u === 'percent' ? ' is-percent' : ''
}

export function unitLabel(unit: Unit | undefined): string {
  switch (unit) {
    case 'money':   return '$'
    case 'percent': return '%'
    default:        return '#'
  }
}
