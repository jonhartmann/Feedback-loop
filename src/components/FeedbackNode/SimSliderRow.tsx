import clsx from 'clsx'
import type { Unit } from '../../types/graph'
import { formatValue } from '../../utils/formulaEval'
import { useSimContext } from '../../context/SimContext'
import { useDraftValue } from '../../hooks/useDraftValue'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compact formatter for sim mode — uses K/M/B suffixes for large numbers */
export function formatSimValue(value: number, unit: Unit | undefined): string {
  if (!isFinite(value)) return '—'
  const raw = unit === 'percent' ? value * 100 : value
  const abs = Math.abs(raw)
  const prefix = unit === 'money' ? '$' : ''
  const suffix = unit === 'percent' ? '%' : ''
  if (abs >= 1e12) return `${prefix}${(raw / 1e12).toFixed(2)}T${suffix}`
  if (abs >= 1e9)  return `${prefix}${(raw / 1e9).toFixed(2)}B${suffix}`
  if (abs >= 1e6)  return `${prefix}${(raw / 1e6).toFixed(2)}M${suffix}`
  return formatValue(value, unit)
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <rect x="1.5" y="5.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      {locked
        ? <path d="M3 5.5V4a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        : <path d="M3 5.5V4a2.5 2.5 0 015 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.5 2" />
      }
    </svg>
  )
}

// ── SimSliderRow ──────────────────────────────────────────────────────────────

export interface SimSliderRowProps {
  nodeKey: string
  label: string
  unit: Unit | undefined
  baseVal: number
  showLabel: boolean
  /** If true, slider uses back-propagation (formula/metric nodes) instead of direct override */
  useBackProp: boolean
  simOverlay: Map<string, number>
  setSimValue: (key: string, value: number) => void
  removeSimValue: (key: string) => void
}

export function SimSliderRow({ nodeKey, label, unit, baseVal, showLabel, useBackProp, simOverlay, setSimValue, removeSimValue }: SimSliderRowProps) {
  const { simEvalMap, backPropagate, lockedKeys, toggleLock } = useSimContext()
  const isLocked = lockedKeys.has(nodeKey)

  // simOverlay stores fractional adjustments (0.20 = +20%), not absolute values.
  // Compute simVal = liveBase * (1 + fixedPct) so it tracks series data while
  // keeping the percentage stable.
  const directPctFraction = simOverlay.get(nodeKey)
  const propagatedVal = simEvalMap.get(nodeKey)
  const isAffectedOnly = directPctFraction === undefined && propagatedVal !== undefined && Math.abs((propagatedVal - baseVal)) > 1e-10

  let simVal: number
  let rawPct: number
  if (directPctFraction !== undefined) {
    simVal = baseVal * (1 + directPctFraction)
    rawPct = directPctFraction * 100
  } else if (isAffectedOnly) {
    simVal = propagatedVal!
    rawPct = baseVal !== 0 ? ((simVal - baseVal) / Math.abs(baseVal)) * 100 : 0
  } else {
    simVal = baseVal
    rawPct = 0
  }

  const sliderPct = Math.max(-80, Math.min(400, rawPct))
  const displayPct = Math.round(rawPct * 10) / 10
  const isPositive = rawPct > 0.05
  const isNegative = rawPct < -0.05

  const { draft, setDraft, focusedRef: pctFocusedRef } = useDraftValue(displayPct)

  function applyPct(pct: number) {
    if (isLocked) return
    if (useBackProp) {
      backPropagate(nodeKey, pct)
    } else {
      setSimValue(nodeKey, pct / 100)
    }
  }

  const rowClass = clsx('sim-panel__row', {
    'sim-panel__row--propagated': isAffectedOnly,
    'sim-panel__row--locked':     isLocked,
  })

  const valueClass = clsx('sim-panel__value', {
    'sim-panel__value--money':   unit === 'money',
    'sim-panel__value--percent': unit === 'percent',
  })

  return (
    <div className={rowClass}>
      <div className="sim-panel__value-display">
        {showLabel && <span className="sim-panel__label">{label}</span>}
        <span className={valueClass}>
          {formatSimValue(simVal, unit)}
        </span>
        {rawPct !== 0 && (
          <span className={clsx('sim-panel__delta', {
            'sim-panel__delta--positive': isPositive,
            'sim-panel__delta--negative': isNegative,
          })}>
            {isPositive ? '+' : ''}{Math.round(rawPct * 10) / 10}%
          </span>
        )}
        <button
          className={clsx('sim-panel__lock', { 'sim-panel__lock--locked': isLocked })}
          title={isLocked
            ? 'Locked — back-propagation stops here. Click to unlock.'
            : useBackProp
              ? 'Lock — back-propagation will not traverse through this node'
              : 'Lock — prevent back-propagation from changing this value'}
          onMouseDown={e => e.stopPropagation()}
          onClick={() => toggleLock(nodeKey)}
        >
          <LockIcon locked={isLocked} />
        </button>
      </div>
      <div className="sim-panel__control" onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
        <input
          type="range"
          min={-80}
          max={400}
          step={1}
          value={sliderPct}
          disabled={isLocked}
          title={useBackProp ? 'Drag to back-propagate: scales upstream inputs to hit this target' : isLocked ? 'Unlock to adjust' : undefined}
          onChange={e => applyPct(Number(e.target.value))}
        />
        <input
          type="number"
          className={clsx('sim-panel__pct-input', {
            'sim-panel__pct-input--positive': isPositive,
            'sim-panel__pct-input--negative': isNegative,
          })}
          value={draft}
          disabled={isLocked}
          onChange={e => setDraft(e.target.value)}
          onFocus={() => { pctFocusedRef.current = true }}
          onBlur={() => {
            pctFocusedRef.current = false
            const n = parseFloat(draft)
            if (isFinite(n)) applyPct(n)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const n = parseFloat(draft)
              if (isFinite(n)) applyPct(n)
              ;(e.target as HTMLInputElement).blur()
            }
            if (e.key === 'Escape') {
              ;(e.target as HTMLInputElement).blur()
            }
          }}
        />
        <span className="sim-panel__pct-unit">%</span>
        {directPctFraction !== undefined && !isLocked && (
          <button
            className="sim-panel__reset"
            title="Reset to formula-computed value"
            onMouseDown={e => e.stopPropagation()}
            onClick={() => removeSimValue(nodeKey)}
          >↺</button>
        )}
      </div>
    </div>
  )
}
