import { useState } from 'react'
import clsx from 'clsx'
import type { Unit } from '../../types/graph'
import { unitLabel } from './nodeFormatting'

interface UnitDropdownProps {
  unit: Unit | undefined
  onChange: (unit: Unit | undefined) => void
  style?: React.CSSProperties
}

const UNIT_OPTIONS: { value: Unit | undefined; symbol: string; name: string }[] = [
  { value: undefined,   symbol: '#', name: 'Number'  },
  { value: 'money',     symbol: '$', name: 'Money'   },
  { value: 'percent',   symbol: '%', name: 'Percent' },
]

export function UnitDropdown({ unit, onChange, style }: UnitDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative', ...style }}>
      <button
        className={clsx('unit-dropdown__trigger', {
          'unit-dropdown__trigger--money':   unit === 'money',
          'unit-dropdown__trigger--percent': unit === 'percent',
        })}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Select unit type"
      >
        {unitLabel(unit)}
      </button>

      {open && (
        <>
          {/* Invisible backdrop to close on outside click */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onMouseDown={e => { e.stopPropagation(); setOpen(false) }}
          />
          <ul className="unit-dropdown__list">
            {UNIT_OPTIONS.map(opt => {
              const active = opt.value === unit || (!opt.value && !unit)
              return (
                <li
                  key={opt.name}
                  className={clsx('unit-dropdown__option', { 'unit-dropdown__option--active': active })}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onChange(opt.value); setOpen(false) }}
                >
                  <span className="unit-dropdown__symbol">{opt.symbol}</span>
                  <span>{opt.name}</span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
