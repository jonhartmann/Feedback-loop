import { useEffect } from 'react'
import type { SerializedGraph } from '../types/graph'

// ── Starter graph: Compounding Interest Calculator ────────────────────────────
// Shows how Constants feed into a Metric node formula.
// Formula: principal * (1 + rate/n)^(n*t)  → ~$20,097 at defaults
const COMPOUNDING_INTEREST: SerializedGraph = {
  version: 1,
  name: 'Compounding Interest Calculator',
  nodes: [
    {
      id: 'ci-n1',
      position: { x: 40, y: 60 },
      data: {
        label: 'Principal',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'ci-p-out', label: 'value', value: 10000, unit: 'money' }],
      },
    },
    {
      id: 'ci-n2',
      position: { x: 40, y: 180 },
      data: {
        label: 'Annual Rate',
        variant: 'constant',
        inputs: [],
        // 0.07 = 7% — displayed as percent, used as a decimal in the formula
        outputs: [{ id: 'ci-r-out', label: 'value', value: 0.07, unit: 'percent' }],
      },
    },
    {
      id: 'ci-n3',
      position: { x: 40, y: 300 },
      data: {
        label: 'Compounds / yr',
        variant: 'constant',
        inputs: [],
        // 12 = monthly compounding
        outputs: [{ id: 'ci-n-out', label: 'value', value: 12 }],
      },
    },
    {
      id: 'ci-n4',
      position: { x: 40, y: 410 },
      data: {
        label: 'Years',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'ci-t-out', label: 'value', value: 10 }],
      },
    },
    {
      id: 'ci-n5',
      position: { x: 360, y: 200 },
      data: {
        label: 'Final Amount',
        variant: 'metric',
        // Input labels become the variable names in the formula scope
        inputs: [
          { id: 'ci-in-p', label: 'principal' },
          { id: 'ci-in-r', label: 'rate' },
          { id: 'ci-in-n', label: 'n' },
          { id: 'ci-in-t', label: 'years' },
        ],
        outputs: [],
        metricFormula: 'principal * (1 + rate / n) ^ (n * years)',
        metricUnit: 'money',
      },
    },
  ],
  edges: [
    { id: 'ci-e1', source: 'ci-n1', sourceHandle: 'ci-p-out', target: 'ci-n5', targetHandle: 'ci-in-p' },
    { id: 'ci-e2', source: 'ci-n2', sourceHandle: 'ci-r-out', target: 'ci-n5', targetHandle: 'ci-in-r' },
    { id: 'ci-e3', source: 'ci-n3', sourceHandle: 'ci-n-out', target: 'ci-n5', targetHandle: 'ci-in-n' },
    { id: 'ci-e4', source: 'ci-n4', sourceHandle: 'ci-t-out', target: 'ci-n5', targetHandle: 'ci-in-t' },
  ],
}

// ── Starter graph: Website Metrics Flow ───────────────────────────────────────
// Demonstrates a multi-step funnel with Expression and Metric nodes.
// Visitors → Engaged Visitors → Conversions → Monthly Revenue
const WEBSITE_METRICS: SerializedGraph = {
  version: 1,
  name: 'Website Metrics Flow',
  nodes: [
    // ── Left column: raw inputs (Constants) ───────────────────────────────
    {
      id: 'wm-n1',
      position: { x: 40, y: 60 },
      data: {
        label: 'Monthly Visitors',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'wm-v-out', label: 'value', value: 50000 }],
      },
    },
    {
      id: 'wm-n2',
      position: { x: 40, y: 190 },
      data: {
        label: 'Bounce Rate',
        variant: 'constant',
        inputs: [],
        // 0.45 = 45% of visitors leave immediately
        outputs: [{ id: 'wm-b-out', label: 'value', value: 0.45, unit: 'percent' }],
      },
    },
    {
      id: 'wm-n3',
      position: { x: 40, y: 380 },
      data: {
        label: 'Conversion Rate',
        variant: 'constant',
        inputs: [],
        // 0.03 = 3% of engaged visitors convert
        outputs: [{ id: 'wm-cr-out', label: 'value', value: 0.03, unit: 'percent' }],
      },
    },
    {
      id: 'wm-n4',
      position: { x: 40, y: 510 },
      data: {
        label: 'Avg Order Value',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'wm-aov-out', label: 'value', value: 85, unit: 'money' }],
      },
    },
    // ── Middle column: intermediate calculations (Expressions) ────────────
    {
      id: 'wm-n5',
      position: { x: 330, y: 100 },
      data: {
        label: 'Engaged Visitors',
        inputs: [
          { id: 'wm-e-in1', label: 'visitors' },
          { id: 'wm-e-in2', label: 'bounceRate' },
        ],
        outputs: [
          // Visitors who did NOT bounce
          { id: 'wm-e-out', label: 'engaged', formula: 'visitors * (1 - bounceRate)' },
        ],
      },
    },
    {
      id: 'wm-n6',
      position: { x: 330, y: 370 },
      data: {
        label: 'Conversions',
        inputs: [
          { id: 'wm-c-in1', label: 'engaged' },
          { id: 'wm-c-in2', label: 'convRate' },
        ],
        outputs: [
          { id: 'wm-c-out', label: 'conversions', formula: 'engaged * convRate' },
        ],
      },
    },
    // ── Right column: headline KPI (Metric) ───────────────────────────────
    {
      id: 'wm-n7',
      position: { x: 620, y: 240 },
      data: {
        label: 'Monthly Revenue',
        variant: 'metric',
        inputs: [
          { id: 'wm-r-in1', label: 'conversions' },
          { id: 'wm-r-in2', label: 'aov' },
        ],
        outputs: [],
        metricFormula: 'conversions * aov',
        metricUnit: 'money',
      },
    },
  ],
  edges: [
    // Visitors funnel → Engaged Visitors
    { id: 'wm-e1', source: 'wm-n1', sourceHandle: 'wm-v-out',   target: 'wm-n5', targetHandle: 'wm-e-in1' },
    { id: 'wm-e2', source: 'wm-n2', sourceHandle: 'wm-b-out',   target: 'wm-n5', targetHandle: 'wm-e-in2' },
    // Engaged Visitors → Conversions
    { id: 'wm-e3', source: 'wm-n5', sourceHandle: 'wm-e-out',   target: 'wm-n6', targetHandle: 'wm-c-in1' },
    { id: 'wm-e4', source: 'wm-n3', sourceHandle: 'wm-cr-out',  target: 'wm-n6', targetHandle: 'wm-c-in2' },
    // Conversions + AOV → Revenue
    { id: 'wm-e5', source: 'wm-n6', sourceHandle: 'wm-c-out',   target: 'wm-n7', targetHandle: 'wm-r-in1' },
    { id: 'wm-e6', source: 'wm-n4', sourceHandle: 'wm-aov-out', target: 'wm-n7', targetHandle: 'wm-r-in2' },
  ],
}

// ── Card definitions ──────────────────────────────────────────────────────────

interface Starter {
  title: string
  icon: string
  description: string
  accent: string   // border + button color
  graph?: SerializedGraph
}

const STARTERS: Starter[] = [
  {
    title: 'Blank',
    icon: '📄',
    description: 'Start with an empty canvas and build your own feedback loop from scratch.',
    accent: '#555',
    graph: undefined,
  },
  {
    title: 'Compounding Interest',
    icon: '📈',
    description: 'See how principal, rate, and time combine into a final balance — adjust any input and watch the result update instantly.',
    accent: '#c89020',
    graph: COMPOUNDING_INTEREST,
  },
  {
    title: 'Website Metrics Flow',
    icon: '🌐',
    description: 'Model a conversion funnel from raw visitor count to monthly revenue, with bounce rate and average order value as levers.',
    accent: '#7c3aed',
    graph: WEBSITE_METRICS,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeOverlay({ onSelect }: { onSelect: (graph?: SerializedGraph) => void }) {
  // Escape key → blank document
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onSelect(undefined)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSelect])

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
          maxWidth: 720,
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

        {/* Card grid */}
        <div style={{ display: 'flex', gap: 16 }}>
          {STARTERS.map(s => (
            <div
              key={s.title}
              style={{
                flex: 1,
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

        <p style={{ margin: '20px 0 0', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
          Press Esc or click outside to start with a blank canvas
        </p>
      </div>
    </div>
  )
}
