import { useState } from 'react'
import clsx from 'clsx'
import type { ChartType } from './SeriesModePanel'

export type DisplayModeCombined = 'value' | 'area' | 'bar'

const OPTIONS: { value: DisplayModeCombined; symbol: string; name: string }[] = [
  { value: 'value', symbol: '~',  name: 'Current Value' },
  { value: 'area',  symbol: '◿',  name: 'Area Graph' },
  { value: 'bar',   symbol: '▮▮', name: 'Bar Graph' },
]

function toDisplayModeCombined(displayMode: string, chartType: ChartType): DisplayModeCombined {
  if (displayMode !== 'series') return 'value'
  return chartType === 'bar' ? 'bar' : 'area'
}

export function DisplayModeDropdown({
  displayMode,
  seriesChartType,
  onChange,
}: {
  displayMode: 'value' | 'series'
  seriesChartType: ChartType
  onChange: (mode: DisplayModeCombined) => void
}) {
  const [open, setOpen] = useState(false)
  const current = toDisplayModeCombined(displayMode, seriesChartType)
  const symbol = OPTIONS.find(o => o.value === current)?.symbol ?? '~'

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="feedback-node__mode-btn"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Display mode"
      >
        {symbol}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onMouseDown={e => { e.stopPropagation(); setOpen(false) }}
          />
          <ul className="unit-dropdown__list" style={{ right: 0, left: 'auto', minWidth: 130 }}>
            {OPTIONS.map(opt => (
              <li
                key={opt.value}
                className={clsx('unit-dropdown__option', { 'unit-dropdown__option--active': opt.value === current })}
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
