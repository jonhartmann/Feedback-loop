import type { SerializedGraph } from '../types/graph'
import { STARTERS } from '../data/starterGraphs'
import { useEscapeKey } from '../hooks/useEscapeKey'
import './WelcomeOverlay.css'

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeOverlay({ onSelect, onStartTour }: { onSelect: (graph?: SerializedGraph) => void; onStartTour: () => void }) {
  useEscapeKey(() => onSelect(undefined))

  return (
    // Backdrop — click outside modal → blank
    <div className="welcome-overlay" onClick={() => onSelect(undefined)}>
      {/* Modal — stop propagation so clicks inside don't close */}
      <div className="welcome-overlay__panel" onClick={e => e.stopPropagation()}>
        <h1 className="welcome-overlay__title">
          Welcome to Feedback Loop
        </h1>
        <p className="welcome-overlay__subtitle">
          A canvas for building evaluatable diagrams — connect constants, measurements,
          and formulas into live-updating models. Pick a starting point:
        </p>

        {/* Card grid — 2×2 wrap */}
        <div className="welcome-overlay__grid">
          {STARTERS.map(s => (
            <div
              key={s.title}
              className="welcome-overlay__card"
              style={{ '--card-accent': s.accent } as React.CSSProperties}
            >
              <div className="welcome-overlay__card-icon">{s.icon}</div>
              <div className="welcome-overlay__card-title">{s.title}</div>
              <p className="welcome-overlay__card-desc">
                {s.description}
              </p>
              <button
                className="welcome-overlay__card-btn"
                onClick={() => onSelect(s.graph)}
              >
                {s.graph ? 'Open example →' : 'Start blank →'}
              </button>
            </div>
          ))}
        </div>

        <div className="welcome-overlay__footer">
          <p className="welcome-overlay__hint">
            Press Esc or click outside to start with a blank canvas
          </p>
          <button className="welcome-overlay__tour-btn" onClick={onStartTour}>
            Take a tour →
          </button>
        </div>
      </div>
    </div>
  )
}
