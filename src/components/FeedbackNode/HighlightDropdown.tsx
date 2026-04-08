import { useState } from 'react'
import clsx from 'clsx'

const OPTIONS: { value: boolean; symbol: string; name: string }[] = [
  { value: false, symbol: '↑', name: 'Higher is better' },
  { value: true,  symbol: '↓', name: 'Lower is better'  },
]

export function HighlightDropdown({
  inverted,
  onChange,
}: {
  inverted: boolean
  onChange: (inverted: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const symbol = inverted ? '↓' : '↑'

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="feedback-node__sim-btn"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title={inverted ? 'Lower is better — click to change' : 'Higher is better — click to change'}
      >
        {symbol}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onMouseDown={e => { e.stopPropagation(); setOpen(false) }}
          />
          <ul className="unit-dropdown__list" style={{ right: 0, left: 'auto', minWidth: 170 }}>
            {OPTIONS.map(opt => (
              <li
                key={String(opt.value)}
                className={clsx('unit-dropdown__option', { 'unit-dropdown__option--active': opt.value === inverted })}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onChange(opt.value); setOpen(false) }}
              >
                <span className="unit-dropdown__symbol">{opt.symbol}</span>
                <span>{opt.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
