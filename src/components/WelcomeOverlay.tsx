import { useEffect } from 'react'
import type { SerializedGraph } from '../types/graph'

// ── Starter graph: Compounding Interest Calculator ────────────────────────────
// Breaks the formula into two intermediate Expression nodes so the flow
// reads left-to-right as a comprehensible calculation:
//
//   Constants  →  Period Rate (rate/n)    ──┐
//             →  Total Periods (n*years)  ──┤──►  Final Amount
//             →  Principal               ──┘       principal * (1+periodRate)^totalPeriods
//
// At defaults (~$20,097): $10k @ 7% compounded monthly for 10 years.
const COMPOUNDING_INTEREST: SerializedGraph = {
  version: 1,
  name: 'Compounding Interest Calculator',
  nodes: [
    // ── Left column: raw inputs ───────────────────────────────────────────
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
      position: { x: 40, y: 190 },
      data: {
        label: 'Annual Rate',
        variant: 'constant',
        inputs: [],
        // 0.07 = 7% — stored as a decimal, formula uses it as-is
        outputs: [{ id: 'ci-r-out', label: 'value', value: 0.07, unit: 'percent' }],
      },
    },
    {
      id: 'ci-n3',
      position: { x: 40, y: 320 },
      data: {
        label: 'Compounds / yr',
        variant: 'constant',
        inputs: [],
        // 12 = monthly compounding; feeds both intermediate expressions
        outputs: [{ id: 'ci-n-out', label: 'value', value: 12 }],
      },
    },
    {
      id: 'ci-n4',
      position: { x: 40, y: 440 },
      data: {
        label: 'Years',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'ci-t-out', label: 'value', value: 10 }],
      },
    },
    // ── Middle column: intermediate calculations ──────────────────────────
    {
      id: 'ci-n5',
      position: { x: 320, y: 130 },
      data: {
        label: 'Period Rate',
        // rate per compounding period, e.g. 7%/12 ≈ 0.5833% per month
        inputs: [
          { id: 'ci-pr-in-r', label: 'rate' },
          { id: 'ci-pr-in-n', label: 'n' },
        ],
        outputs: [{ id: 'ci-pr-out', label: 'periodRate', formula: 'rate / n' }],
      },
    },
    {
      id: 'ci-n6',
      position: { x: 320, y: 360 },
      data: {
        label: 'Total Periods',
        // total number of compounding periods, e.g. 12 × 10 = 120 months
        inputs: [
          { id: 'ci-tp-in-n', label: 'n' },
          { id: 'ci-tp-in-y', label: 'years' },
        ],
        outputs: [{ id: 'ci-tp-out', label: 'totalPeriods', formula: 'n * years' }],
      },
    },
    // ── Right column: final KPI ───────────────────────────────────────────
    {
      id: 'ci-n7',
      position: { x: 600, y: 240 },
      data: {
        label: 'Final Amount',
        variant: 'metric',
        inputs: [
          { id: 'ci-fa-in-p',  label: 'principal' },
          { id: 'ci-fa-in-pr', label: 'periodRate' },
          { id: 'ci-fa-in-tp', label: 'totalPeriods' },
        ],
        outputs: [],
        metricFormula: 'principal * (1 + periodRate) ^ totalPeriods',
        metricUnit: 'money',
      },
    },
  ],
  edges: [
    // Constants → Period Rate
    { id: 'ci-e1', source: 'ci-n2', sourceHandle: 'ci-r-out',   target: 'ci-n5', targetHandle: 'ci-pr-in-r' },
    { id: 'ci-e2', source: 'ci-n3', sourceHandle: 'ci-n-out',   target: 'ci-n5', targetHandle: 'ci-pr-in-n' },
    // Constants → Total Periods
    { id: 'ci-e3', source: 'ci-n3', sourceHandle: 'ci-n-out',   target: 'ci-n6', targetHandle: 'ci-tp-in-n' },
    { id: 'ci-e4', source: 'ci-n4', sourceHandle: 'ci-t-out',   target: 'ci-n6', targetHandle: 'ci-tp-in-y' },
    // Intermediates + Principal → Final Amount
    { id: 'ci-e5', source: 'ci-n1', sourceHandle: 'ci-p-out',   target: 'ci-n7', targetHandle: 'ci-fa-in-p'  },
    { id: 'ci-e6', source: 'ci-n5', sourceHandle: 'ci-pr-out',  target: 'ci-n7', targetHandle: 'ci-fa-in-pr' },
    { id: 'ci-e7', source: 'ci-n6', sourceHandle: 'ci-tp-out',  target: 'ci-n7', targetHandle: 'ci-fa-in-tp' },
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

// ── Starter graph: Business KPI Relationships ─────────────────────────────────
// Models the classic LTV:CAC ratio — the single most-watched health metric for
// subscription and e-commerce businesses.
//
//   Order Value × Frequency  →  Annual Revenue / Customer  ──┐
//   Annual Revenue × Margin × Lifespan                    →  LTV  ──┐
//                                                                    ├──►  LTV:CAC Ratio
//   Mktg Spend / New Customers                            →  CAC  ──┘
//
// At defaults: LTV ≈ $367, CAC = $75, ratio ≈ 4.9 (healthy = > 3).
const BUSINESS_KPIS: SerializedGraph = {
  version: 1,
  name: 'Business KPI Relationships',
  nodes: [
    // ── Left column: raw business inputs (Constants) ──────────────────────
    {
      id: 'kpi-n1',
      position: { x: 40, y: 60 },
      data: {
        label: 'Avg Order Value',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'kpi-aov-out', label: 'value', value: 85, unit: 'money' }],
      },
    },
    {
      id: 'kpi-n2',
      position: { x: 40, y: 190 },
      data: {
        label: 'Purchase Frequency',
        variant: 'constant',
        inputs: [],
        // purchases per year per customer
        outputs: [{ id: 'kpi-freq-out', label: 'value', value: 3.2 }],
      },
    },
    {
      id: 'kpi-n3',
      position: { x: 40, y: 330 },
      data: {
        label: 'Gross Margin',
        variant: 'constant',
        inputs: [],
        // 0.45 = 45% — the portion of revenue that becomes gross profit
        outputs: [{ id: 'kpi-margin-out', label: 'value', value: 0.45, unit: 'percent' }],
      },
    },
    {
      id: 'kpi-n4',
      position: { x: 40, y: 460 },
      data: {
        label: 'Customer Lifespan',
        variant: 'constant',
        inputs: [],
        // average years a customer stays before churning
        outputs: [{ id: 'kpi-life-out', label: 'value', value: 3 }],
      },
    },
    {
      id: 'kpi-n5',
      position: { x: 40, y: 620 },
      data: {
        label: 'Mktg Spend / mo',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'kpi-spend-out', label: 'value', value: 15000, unit: 'money' }],
      },
    },
    {
      id: 'kpi-n6',
      position: { x: 40, y: 750 },
      data: {
        label: 'New Customers / mo',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'kpi-acq-out', label: 'value', value: 200 }],
      },
    },
    // ── Middle column: intermediate KPIs (Expressions) ────────────────────
    {
      id: 'kpi-n7',
      position: { x: 330, y: 100 },
      data: {
        label: 'Annual Rev / Customer',
        inputs: [
          { id: 'kpi-ar-in1', label: 'orderValue' },
          { id: 'kpi-ar-in2', label: 'frequency' },
        ],
        outputs: [
          // e.g. $85 × 3.2 = $272/yr
          { id: 'kpi-ar-out', label: 'annualRevenue', formula: 'orderValue * frequency', unit: 'money' },
        ],
      },
    },
    {
      id: 'kpi-n8',
      position: { x: 330, y: 310 },
      data: {
        label: 'Customer LTV',
        // Lifetime Value = annual revenue × margin × avg years retained
        inputs: [
          { id: 'kpi-ltv-in1', label: 'annualRevenue' },
          { id: 'kpi-ltv-in2', label: 'margin' },
          { id: 'kpi-ltv-in3', label: 'lifespan' },
        ],
        outputs: [
          // e.g. $272 × 0.45 × 3 = $367.20
          { id: 'kpi-ltv-out', label: 'ltv', formula: 'annualRevenue * margin * lifespan', unit: 'money' },
        ],
      },
    },
    {
      id: 'kpi-n9',
      position: { x: 330, y: 650 },
      data: {
        label: 'CAC',
        // Customer Acquisition Cost = total spend ÷ customers acquired
        inputs: [
          { id: 'kpi-cac-in1', label: 'spend' },
          { id: 'kpi-cac-in2', label: 'acquired' },
        ],
        outputs: [
          // e.g. $15,000 ÷ 200 = $75
          { id: 'kpi-cac-out', label: 'cac', formula: 'spend / acquired', unit: 'money' },
        ],
      },
    },
    // ── Right column: headline ratio (Metric) ─────────────────────────────
    {
      id: 'kpi-n10',
      position: { x: 630, y: 400 },
      data: {
        label: 'LTV : CAC Ratio',
        variant: 'metric',
        // Rule of thumb: > 3 = healthy, < 1 = burning money on acquisition
        inputs: [
          { id: 'kpi-r-in1', label: 'ltv' },
          { id: 'kpi-r-in2', label: 'cac' },
        ],
        outputs: [],
        metricFormula: 'ltv / cac',
      },
    },
  ],
  edges: [
    // Inputs → Annual Revenue / Customer
    { id: 'kpi-e1', source: 'kpi-n1', sourceHandle: 'kpi-aov-out',   target: 'kpi-n7', targetHandle: 'kpi-ar-in1'  },
    { id: 'kpi-e2', source: 'kpi-n2', sourceHandle: 'kpi-freq-out',  target: 'kpi-n7', targetHandle: 'kpi-ar-in2'  },
    // Annual Revenue + Margin + Lifespan → Customer LTV
    { id: 'kpi-e3', source: 'kpi-n7', sourceHandle: 'kpi-ar-out',    target: 'kpi-n8', targetHandle: 'kpi-ltv-in1' },
    { id: 'kpi-e4', source: 'kpi-n3', sourceHandle: 'kpi-margin-out',target: 'kpi-n8', targetHandle: 'kpi-ltv-in2' },
    { id: 'kpi-e5', source: 'kpi-n4', sourceHandle: 'kpi-life-out',  target: 'kpi-n8', targetHandle: 'kpi-ltv-in3' },
    // Spend + New Customers → CAC
    { id: 'kpi-e6', source: 'kpi-n5', sourceHandle: 'kpi-spend-out', target: 'kpi-n9', targetHandle: 'kpi-cac-in1' },
    { id: 'kpi-e7', source: 'kpi-n6', sourceHandle: 'kpi-acq-out',   target: 'kpi-n9', targetHandle: 'kpi-cac-in2' },
    // LTV + CAC → Ratio
    { id: 'kpi-e8', source: 'kpi-n8', sourceHandle: 'kpi-ltv-out',   target: 'kpi-n10', targetHandle: 'kpi-r-in1' },
    { id: 'kpi-e9', source: 'kpi-n9', sourceHandle: 'kpi-cac-out',   target: 'kpi-n10', targetHandle: 'kpi-r-in2' },
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
  {
    title: 'Business KPI Relationships',
    icon: '💼',
    description: 'Map the LTV:CAC ratio — the key health metric for any growth business. Adjust marketing spend, margins, or churn and see the ratio respond.',
    accent: '#1a7a3a',
    graph: BUSINESS_KPIS,
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

        <p style={{ margin: '20px 0 0', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
          Press Esc or click outside to start with a blank canvas
        </p>
      </div>
    </div>
  )
}
