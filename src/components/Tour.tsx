import { useEffect, useLayoutEffect, useState } from 'react'
import { useTour } from '../context/TourContext'
import { useEscapeKey } from '../hooks/useEscapeKey'

// ── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  /** data-tour attribute value, 'first-node' for the first canvas node, or null for centered */
  target: string | null
  title: string
  body: string
  /** Preferred side for the popover relative to the target. 'auto' picks based on screen position. */
  placement?: 'below' | 'above' | 'right' | 'left' | 'auto'
}

const STEPS: Step[] = [
  {
    target: null,
    title: 'Welcome to Feedback Loop',
    body: "We've loaded an example graph so you can follow along. This quick tour covers the main features — exit any time with Esc or ×.",
  },
  {
    target: 'node-buttons',
    title: 'Creating nodes',
    body: 'Nodes are the building blocks of your model. Constants hold fixed numbers, Measures pull live data, Expressions compute formulas across inputs, and Metrics display your key results.',
    placement: 'below',
  },
  {
    target: 'canvas',
    title: 'The canvas',
    body: 'Arrange nodes anywhere on the canvas. Scroll to zoom, click-and-drag empty space to pan. Select a node or edge and press Delete to remove it.',
    placement: 'auto',
  },
  {
    target: 'first-node',
    title: 'Working with nodes',
    body: 'Hover a node to expand it and reveal its ports. Drag from an output port (right side) to an input port (left side) on another node to connect them — the downstream formula can then reference the upstream value by port name.',
    placement: 'right',
  },
  {
    target: 'experiment-btn',
    title: 'Experiment Mode',
    body: 'Toggle Experiment to enter what-if mode. On constants, drag sliders to adjust values and watch downstream metrics update live. On a metric, set a target percentage and the app back-propagates the required change across upstream constants.',
    placement: 'below',
  },
  {
    target: 'library-btn',
    title: 'The Library',
    body: 'Save any node as a reusable template by right-clicking it. Open the Library drawer to drag saved nodes onto the canvas in any future graph.',
    placement: 'below',
  },
  {
    target: 'save-load',
    title: 'Saving your work',
    body: 'Save downloads your graph as a portable JSON file. Load imports a previously saved graph. Files are human-readable and can be shared or stored in version control.',
    placement: 'below',
  },
  {
    target: null,
    title: "You're all set!",
    body: "Start building your own model or keep exploring the example. Open Help any time to revisit these topics in detail.",
  },
]

// ── Spotlight geometry ───────────────────────────────────────────────────────

const PAD = 10
const RADIUS = 8
const POPOVER_WIDTH = 320
const POPOVER_GAP = 16

interface Rect { x: number; y: number; width: number; height: number }

function getTargetRect(target: string | null): Rect | null {
  if (!target) return null
  const el = target === 'first-node'
    ? document.querySelector('.react-flow__node')
    : document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, width: r.width, height: r.height }
}

function computePopoverStyle(
  rect: Rect | null,
  placement: Step['placement'],
  vw: number,
  vh: number,
): React.CSSProperties {
  if (!rect) {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: POPOVER_WIDTH,
      zIndex: 2001,
    }
  }

  const spotLeft = rect.x - PAD
  const spotTop = rect.y - PAD
  const spotRight = rect.x + rect.width + PAD
  const spotBottom = rect.y + rect.height + PAD

  const side = (!placement || placement === 'auto')
    ? (spotBottom < vh * 0.6 ? 'below' : 'above')
    : placement

  let top: number, left: number

  if (side === 'below') {
    top = spotBottom + POPOVER_GAP
    left = Math.min(Math.max(spotLeft, 12), vw - POPOVER_WIDTH - 12)
  } else if (side === 'above') {
    top = spotTop - POPOVER_GAP - 180
    left = Math.min(Math.max(spotLeft, 12), vw - POPOVER_WIDTH - 12)
  } else if (side === 'right') {
    top = Math.min(Math.max(spotTop, 12), vh - 220)
    left = Math.min(spotRight + POPOVER_GAP, vw - POPOVER_WIDTH - 12)
  } else {
    top = Math.min(Math.max(spotTop, 12), vh - 220)
    left = Math.max(spotLeft - POPOVER_WIDTH - POPOVER_GAP, 12)
  }

  return { position: 'fixed', top, left, width: POPOVER_WIDTH, zIndex: 2001 }
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Tour() {
  const { active, step, totalSteps, endTour, nextStep, prevStep } = useTour()
  const [rect, setRect] = useState<Rect | null>(null)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEscapeKey(endTour)

  const currentStep = STEPS[step]

  // Update rect whenever step changes or viewport resizes
  useLayoutEffect(() => {
    if (!active) return
    function measure() {
      setVp({ w: window.innerWidth, h: window.innerHeight })
      setRect(getTargetRect(currentStep.target))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active, currentStep])

  // Small delay for step 3 (first-node) so ReactFlow has rendered the graph
  useEffect(() => {
    if (!active || currentStep.target !== 'first-node') return
    const id = setTimeout(() => setRect(getTargetRect('first-node')), 120)
    return () => clearTimeout(id)
  }, [active, currentStep])

  if (!active) return null

  const spotX = rect ? rect.x - PAD : 0
  const spotY = rect ? rect.y - PAD : 0
  const spotW = rect ? rect.width + 2 * PAD : 0
  const spotH = rect ? rect.height + 2 * PAD : 0

  const popoverStyle = computePopoverStyle(rect, currentStep.placement, vp.w, vp.h)
  const isFirst = step === 0
  const isLast = step === totalSteps - 1

  return (
    <>
      {/* SVG overlay with mask cutout */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2000, pointerEvents: rect ? 'all' : 'all' }}
        onClick={rect ? undefined : endTour}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={spotX} y={spotY} width={spotW} height={spotH}
                rx={RADIUS} ry={RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 15, 40, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
        {/* Highlight ring around spotlight */}
        {rect && (
          <rect
            x={spotX} y={spotY} width={spotW} height={spotH}
            rx={RADIUS} ry={RADIUS}
            fill="none"
            stroke="rgba(100, 160, 255, 0.6)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Popover card */}
      <div
        style={{
          ...popoverStyle,
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Card header */}
        <div style={{
          background: '#1a1a2e',
          padding: '14px 16px 12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#6080b0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Step {step + 1} of {totalSteps}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8ff' }}>
              {currentStep.title}
            </div>
          </div>
          <button
            onClick={endTour}
            style={{ background: 'none', border: 'none', color: '#6060a0', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
            title="Exit tour (Esc)"
          >
            ×
          </button>
        </div>

        {/* Step indicator dots */}
        <div style={{ display: 'flex', gap: 5, padding: '10px 16px 0', background: '#fff' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? '#2255aa' : i < step ? '#99b8e8' : '#d0d0e8',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '12px 16px 16px', fontSize: 13, color: '#333', lineHeight: 1.6 }}>
          {currentStep.body}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 14px' }}>
          <button
            onClick={prevStep}
            disabled={isFirst}
            style={{
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid #d0d0e0',
              borderRadius: 6,
              background: 'none',
              color: isFirst ? '#bbb' : '#444',
              cursor: isFirst ? 'default' : 'pointer',
            }}
          >
            ← Back
          </button>
          <button
            onClick={nextStep}
            style={{
              padding: '7px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              background: '#2255aa',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {isLast ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
