import { useEffect, useLayoutEffect, useState } from 'react'
import clsx from 'clsx'
import { useTour } from '../context/TourContext'
import { useEscapeKey } from '../hooks/useEscapeKey'
import './Tour.css'

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
    body: 'Nodes are the building blocks of your model. Constants hold fixed numbers, Measures pull live data, Expressions compute formulas across inputs, and Metrics display your key results. Click a button to add a node at the canvas centre, or drag it onto the canvas to place it exactly where you want.',
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
    body: 'Save any node as a reusable template by clicking the ☆ star in its header (visible on hover). The Library also includes built-in templates for Measures, Expressions, and Metrics. Click an item to add it to the canvas, or drag it to a specific position.',
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

  const isLargeTarget = rect.height > vh * 0.5
  const side = (!placement || placement === 'auto')
    ? (isLargeTarget ? 'center' : spotBottom < vh * 0.6 ? 'below' : 'above')
    : placement

  // Center the popover over the target rect
  if (side === 'center') {
    return {
      position: 'fixed',
      top: Math.min(Math.max(rect.y + rect.height / 2 - 110, 12), vh - 220),
      left: Math.min(Math.max(rect.x + rect.width / 2 - POPOVER_WIDTH / 2, 12), vw - POPOVER_WIDTH - 12),
      width: POPOVER_WIDTH,
      zIndex: 2001,
    }
  }

  let top: number, left: number

  if (side === 'below') {
    top = spotBottom + POPOVER_GAP
    left = Math.min(Math.max(spotLeft, 12), vw - POPOVER_WIDTH - 12)
  } else if (side === 'above') {
    top = Math.max(spotTop - POPOVER_GAP - 180, 12)
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
          fill="rgba(5, 8, 13, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
        {/* Highlight ring around spotlight */}
        {rect && (
          <rect
            x={spotX} y={spotY} width={spotW} height={spotH}
            rx={RADIUS} ry={RADIUS}
            fill="none"
            stroke="rgba(191, 95, 11, 0.6)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Popover card — position/top/left/width/zIndex set via computePopoverStyle */}
      <div
        className="tour-popover"
        style={popoverStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Card header */}
        <div className="tour-popover__header">
          <div className="tour-popover__header-text">
            <div className="tour-popover__step-label">
              Step {step + 1} of {totalSteps}
            </div>
            <div className="tour-popover__title">
              {currentStep.title}
            </div>
          </div>
          <button className="tour-popover__close" onClick={endTour} title="Exit tour (Esc)">
            ×
          </button>
        </div>

        {/* Step indicator dots */}
        <div className="tour-popover__dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={clsx('tour-popover__dot', {
                'tour-popover__dot--active': i === step,
                'tour-popover__dot--done':   i < step,
              })}
            />
          ))}
        </div>

        {/* Body */}
        <div className="tour-popover__body">
          {currentStep.body}
        </div>

        {/* Navigation */}
        <div className="tour-popover__nav">
          <button
            className="tour-popover__back-btn"
            onClick={prevStep}
            disabled={isFirst}
          >
            ← Back
          </button>
          <button className="tour-popover__next-btn" onClick={nextStep}>
            {isLast ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
