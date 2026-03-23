import type { SerializedGraph } from '../types/graph'
import { STARTERS } from '../data/starterGraphs'
import { useEscapeKey } from '../hooks/useEscapeKey'

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeOverlay({ onSelect, onStartTour }: { onSelect: (graph?: SerializedGraph) => void; onStartTour: () => void }) {
  useEscapeKey(() => onSelect(undefined))

  return (
    // Backdrop — click outside modal → blank
    <div
      onClick={() => onSelect(undefined)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 30, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Modal — stop propagation so clicks inside don't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
          maxWidth: 760,
          width: '100%',
          padding: '32px 32px 28px',
          fontFamily: 'sans-serif',
        }}
      >
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#111' }}>
          Welcome to Feedback Loop
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
          A canvas for building evaluatable diagrams — connect constants, measurements,
          and formulas into live-updating models. Pick a starting point:
        </p>

        {/* Card grid — 2×2 wrap */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {STARTERS.map(s => (
            <div
              key={s.title}
              style={{
                flex: '0 0 calc(50% - 8px)',
                border: `2px solid ${s.accent}`,
                borderRadius: 10,
                padding: '20px 18px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: '#fafafa',
                transition: 'box-shadow 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.12)`
                el.style.background = '#fff'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.boxShadow = 'none'
                el.style.background = '#fafafa'
              }}
            >
              <div style={{ fontSize: 28, lineHeight: 1 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{s.title}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.5, flex: 1 }}>
                {s.description}
              </p>
              <button
                onClick={() => onSelect(s.graph)}
                style={{
                  marginTop: 6,
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: 6,
                  background: s.accent,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                  opacity: 0.92,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.92' }}
              >
                {s.graph ? 'Open example →' : 'Start blank →'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>
            Press Esc or click outside to start with a blank canvas
          </p>
          <button
            onClick={onStartTour}
            style={{
              background: 'none',
              border: '1px solid #c0c0d8',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: '#5566aa',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#5566aa' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c0c0d8' }}
          >
            Take a tour →
          </button>
        </div>
      </div>
    </div>
  )
}
