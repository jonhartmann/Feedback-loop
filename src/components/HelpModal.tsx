import { useState } from 'react'
import { useEscapeKey } from '../hooks/useEscapeKey'

const SECTIONS = [
  'Overview',
  'Node Types',
  'Connections & Formulas',
  'Units',
  'Editing Ports',
  'Experiment Mode',
  'Series Mode',
  'Library & Files',
  'Keyboard Shortcuts',
] as const

type Section = typeof SECTIONS[number]

const SECTION_COMPONENTS: Record<Section, React.ReactNode> = {
  'Overview': <SectionOverview />,
  'Node Types': <SectionNodeTypes />,
  'Connections & Formulas': <SectionFormulas />,
  'Units': <SectionUnits />,
  'Editing Ports': <SectionEditingPorts />,
  'Experiment Mode': <SectionExperiment />,
  'Series Mode': <SectionSeries />,
  'Library & Files': <SectionLibrary />,
  'Keyboard Shortcuts': <SectionKeyboard />,
}

export default function HelpModal({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<Section>('Overview')
  useEscapeKey(onClose)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 30, 0.65)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.32)',
          width: '100%',
          maxWidth: 880,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '18px 24px 16px',
          borderBottom: '1px solid #e8e8f0',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Feedback Loop — Help</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              Build evaluatable node graphs with formulas, units, and what-if simulation
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: '#999',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 6px',
            }}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{
            width: 180,
            flexShrink: 0,
            borderRight: '1px solid #e8e8f0',
            padding: '12px 0',
            overflowY: 'auto',
          }}>
            {SECTIONS.map(s => (
              <button
                key={s}
                onClick={() => setActive(s)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 18px',
                  border: 'none',
                  background: active === s ? '#f0f0ff' : 'none',
                  color: active === s ? '#2255aa' : '#444',
                  fontSize: 13,
                  fontWeight: active === s ? 600 : 400,
                  cursor: 'pointer',
                  borderLeft: active === s ? '3px solid #2255aa' : '3px solid transparent',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {SECTION_COMPONENTS[active]}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared helpers ──────────────────────────────────────────────────────────────

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#111' }}>{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 14px', fontSize: 13, color: '#444', lineHeight: 1.6 }}>{children}</p>
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 18 }}>
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: '#f4f4f8', color: '#333', fontWeight: 600, borderBottom: '1px solid #ddd' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '7px 10px', color: '#444', borderBottom: '1px solid #eee' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Code({ children }: { children: string }) {
  return (
    <code style={{ background: '#f0f0f8', padding: '2px 6px', borderRadius: 4, fontSize: 12, color: '#2255aa', fontFamily: 'monospace' }}>
      {children}
    </code>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={{
      background: '#f4f4f8',
      border: '1px solid #e0e0ea',
      borderRadius: 6,
      padding: '12px 14px',
      fontSize: 12,
      color: '#333',
      fontFamily: 'monospace',
      overflowX: 'auto',
      marginBottom: 16,
      lineHeight: 1.6,
    }}>
      {children}
    </pre>
  )
}

function Badge({ children, color }: { children: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 600,
      background: color + '22',
      color: color,
      border: `1px solid ${color}55`,
      marginRight: 6,
    }}>
      {children}
    </span>
  )
}

function NodeTypeCard({ badge, color, label, children }: { badge: string; color: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <Badge color={color}>{badge}</Badge>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>+ {label}</span>
      </div>
      <P>{children}</P>
    </div>
  )
}

// ── Sections ────────────────────────────────────────────────────────────────────

function SectionOverview() {
  return (
    <>
      <Heading>What is Feedback Loop?</Heading>
      <P>
        Feedback Loop is a visual canvas for building evaluatable models. You connect
        <strong> constants</strong>, <strong>expressions</strong>, and <strong>metrics</strong> into a live graph
        that recalculates instantly whenever any input changes.
      </P>
      <P>
        Use it to model marketing funnels, financial projections, business KPIs, or any
        domain where values feed into each other through formulas.
      </P>

      <Heading>Quick start</Heading>
      <ol style={{ fontSize: 13, color: '#444', lineHeight: 2, paddingLeft: 20, margin: '0 0 16px' }}>
        <li>Click <strong>Templates</strong> (top-right) to load a starter graph, or add nodes with the toolbar buttons.</li>
        <li>Connect nodes by dragging from an output port to an input port.</li>
        <li>Write formulas in Expression/Metric nodes using the input port labels as variables.</li>
        <li>Adjust constants — all downstream values update immediately.</li>
        <li>Click <strong>Experiment</strong> to enter simulation mode and run what-if scenarios.</li>
        <li>Click <strong>Save</strong> to download your graph as a JSON file.</li>
      </ol>

      <Heading>Canvas navigation</Heading>
      <Table
        headers={['Action', 'How']}
        rows={[
          ['Pan', 'Click and drag on empty canvas space'],
          ['Zoom', 'Scroll wheel, or use the controls panel (bottom-left)'],
          ['Fit view', 'Fit button in the controls panel'],
          ['Select node/edge', 'Click it'],
          ['Multi-select', 'Click and drag a selection rectangle'],
          ['Delete selected', 'Press Delete key'],
          ['Move a node', 'Drag from its header bar'],
        ]}
      />
    </>
  )
}

function SectionNodeTypes() {
  return (
    <>
      <Heading>Node types</Heading>
      <P>There are four node types, each created from the toolbar.</P>

      <NodeTypeCard badge="Constant" color="#c89020" label="Constant">
        A fixed number you set manually — interest rates, headcount, price, etc. Has one output port. Supports <Code>number</Code>, <Code>money</Code>, and <Code>percent</Code> units.
      </NodeTypeCard>

      <NodeTypeCard badge="Measure" color="#1a6bb5" label="Measure">
        Like a Constant, but fetches its value from an external URL on a 3-second refresh interval. Use it for live data feeds.
      </NodeTypeCard>

      <NodeTypeCard badge="Expression" color="#555" label="Expression">
        A computation node with multiple inputs and multiple outputs. Each output has its own formula. Input port labels become variables in your formulas. Use it for intermediate calculations.
      </NodeTypeCard>

      <NodeTypeCard badge="Metric" color="#7c3aed" label="Metric">
        A KPI node with multiple inputs and a single headline formula. Use it for final results you want to highlight — revenue targets, ratios, totals.
      </NodeTypeCard>
    </>
  )
}

function SectionFormulas() {
  return (
    <>
      <Heading>Connecting nodes</Heading>
      <P>
        Drag from an <strong>output port</strong> (right side of a node) to an <strong>input port</strong> (left side).
        Each connected input becomes a named variable in the downstream node's formulas.
        To delete an edge, click it and press <Code>Delete</Code>.
      </P>
      <P>
        <em>Cycle detection is automatic</em> — the graph will not allow circular connections.
      </P>

      <Heading>Writing formulas</Heading>
      <P>
        Formulas use standard math syntax. The autocomplete dropdown shows available variables (from input port labels),
        node-level constants, and built-in functions.
      </P>

      <CodeBlock>{`# Input port "Monthly Visitors" → variable monthlyVisitors
monthlyVisitors * conversionRate

# Compound interest
principal * pow(1 + rate / periods, periods * years)

# Conditional
if(ltv / cac > 3, ltv / cac, 0)

# Round to 2 decimal places
round(revenue / customers, 2)`}</CodeBlock>

      <Heading>Built-in functions</Heading>
      <Table
        headers={['Category', 'Functions']}
        rows={[
          ['Arithmetic', 'abs, sqrt, pow, mod, sign'],
          ['Rounding', 'round, floor, ceil'],
          ['Comparison', 'min, max'],
          ['Aggregation', 'sum, mean'],
          ['Logarithm', 'log, log2, log10, exp'],
          ['Conditional', 'if(condition, thenValue, elseValue)'],
          ['Trigonometry', 'sin, cos, tan, atan2'],
          ['Constants', 'pi, e, Infinity'],
        ]}
      />

      <Heading>Formula states</Heading>
      <Table
        headers={['Display', 'Meaning']}
        rows={[
          ['A number', 'Evaluated successfully'],
          ['—', 'Valid formula but upstream inputs are missing (symbolic)'],
          ['⚠', 'Syntax error or evaluation failed'],
        ]}
      />
    </>
  )
}

function SectionUnits() {
  return (
    <>
      <Heading>Units</Heading>
      <P>Every port has a unit that controls how its value is displayed and how it propagates downstream.</P>

      <Table
        headers={['Unit', 'Display format', 'Example']}
        rows={[
          ['number', 'Plain decimal with commas', '42,300'],
          ['money', 'Dollar sign with cents', '$42,300.00'],
          ['percent', 'Stored as decimal, shown as %', '0.425 → 42.5%'],
        ]}
      />

      <Heading>Changing a unit</Heading>
      <P>Click the <strong>unit badge</strong> on any port to cycle: <Code>number</Code> → <Code>money</Code> → <Code>percent</Code> → <Code>number</Code>.</P>

      <Heading>Unit inference</Heading>
      <P>When a port has no explicit unit, it infers one from its upstream connections:</P>
      <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, margin: '0 0 14px' }}>
        <li>If any input is <Code>money</Code>, the output is <Code>money</Code></li>
        <li>If all inputs are <Code>percent</Code>, the output is <Code>percent</Code></li>
        <li>Otherwise the output is <Code>number</Code></li>
      </ul>
    </>
  )
}

function SectionEditingPorts() {
  return (
    <>
      <Heading>Renaming ports</Heading>
      <P>Click a port label and type a new name, then press <Code>Enter</Code>. The new name becomes the variable name in downstream formulas (camelCased automatically).</P>

      <Heading>Reordering ports</Heading>
      <P>Grab the <strong>⠿ drag handle</strong> to the left of any port label and drag it up or down to reorder.</P>

      <Heading>Quick-add buttons</Heading>
      <P>In expanded mode, Expression nodes show:</P>
      <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, margin: '0 0 14px' }}>
        <li><strong>+ in</strong> — add a new input port</li>
        <li><strong>+ const</strong> — add a node-level named constant (scoped to this node)</li>
        <li><strong>+ out</strong> — add a new output port</li>
      </ul>

      <Heading>Full port editor</Heading>
      <P>Click the <strong>Editor</strong> button when a node is expanded for a comprehensive panel covering all port properties: label, formula, value, and unit.</P>

      <Heading>Expanding / collapsing nodes</Heading>
      <P>Hover over or click a node to expand it and see all ports and formulas. Nodes collapse to a compact label + value view when not focused. In Experiment Mode they collapse automatically to keep the canvas readable.</P>
    </>
  )
}

function SectionExperiment() {
  return (
    <>
      <Heading>Experiment Mode (What-If)</Heading>
      <P>
        Click the <strong>Experiment</strong> button in the toolbar to enter simulation mode.
        All nodes gain <strong>sim sliders</strong> showing their current value and a percentage delta from the baseline.
      </P>

      <Heading>Direct override — Constants &amp; Measures</Heading>
      <P>
        Drag the slider on a Constant or Measure node to scale its value by a percentage (−80% to +400%).
        The change propagates forward through all downstream nodes in real time.
      </P>

      <Heading>Back-propagation — Expressions &amp; Metrics</Heading>
      <P>
        Set a target on a downstream Expression or Metric node's slider.
        Feedback Loop works <em>backwards</em> to find what upstream Constant values need to change,
        then distributes the required adjustment proportionally across all unlocked constants.
      </P>
      <P>
        <em>Example:</em> You want 20% more monthly revenue. Set the revenue metric's slider to +20%.
        The app automatically adjusts upstream constants — Monthly Visitors, Ad Spend, etc. — to reach that target.
      </P>

      <Heading>Locking constants</Heading>
      <P>
        Click the <strong>lock icon</strong> on a Constant's sim slider to exclude it from back-propagation.
        Only unlocked constants absorb the distributed change.
      </P>
      <P>
        <em>Tip:</em> Lock "Conversion Rate" (hard to change) and leave "Ad Spend" unlocked to ask:
        "How much more do I need to spend to hit this revenue number?"
      </P>

      <Heading>Resetting</Heading>
      <P>Toggle the <strong>Experiment</strong> button off to clear all simulation overrides and return to the baseline graph.</P>
    </>
  )
}

function SectionSeries() {
  return (
    <>
      <Heading>Series Mode (Timeline View)</Heading>
      <P>Any node can track a history of its primary output value and display it as a chart.</P>

      <Heading>Activating</Heading>
      <P>Click the <strong>series icon</strong> in a node's header. The node expands to show a chart. The last 100 recorded values are stored.</P>

      <Heading>Chart types</Heading>
      <Table
        headers={['Icon', 'Type', 'Best for']}
        rows={[
          ['∿', 'Line', 'Continuous trends'],
          ['◿', 'Area', 'Filled trend with visual emphasis'],
          ['▮▮', 'Bar', 'Discrete values or step changes'],
        ]}
      />

      <Heading>When to use it</Heading>
      <P>Watch how a metric responds as you drag a sim slider in Experiment Mode, or observe how a live Measure node's value fluctuates over time.</P>
    </>
  )
}

function SectionLibrary() {
  return (
    <>
      <Heading>The Library</Heading>
      <P>
        Click <strong>Library</strong> in the toolbar to open the right sidebar.
        It contains reusable node templates organized by type.
      </P>

      <Heading>Using library items</Heading>
      <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, margin: '0 0 14px' }}>
        <li><strong>Click</strong> an item to add a copy to the center of the canvas</li>
        <li><strong>Drag</strong> an item onto the canvas and drop it at a specific position</li>
      </ul>

      <Heading>Saving nodes to the library</Heading>
      <P>Right-click any node on the canvas and choose <strong>Save to Library</strong>. The full node configuration — ports, formulas, variables — is saved as a reusable template.</P>

      <Heading>Managing library items</Heading>
      <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, margin: '0 0 14px' }}>
        <li><strong>Edit</strong> — click the edit button on any item to modify its label or defaults</li>
        <li><strong>+ New</strong> — create a library item from scratch</li>
        <li><strong>Reset</strong> — restore the built-in defaults (confirmation required)</li>
      </ul>
      <P>Library items are stored in your browser's <Code>localStorage</Code> and persist between sessions.</P>

      <Heading>Saving and loading graphs</Heading>
      <Table
        headers={['Button', 'Action']}
        rows={[
          ['Save', 'Downloads the graph as a .json file (named after your document)'],
          ['Load', 'Opens a file picker to import a .json graph file'],
          ['Templates', 'Opens the starter template picker'],
        ]}
      />
      <P>Saved files are plain JSON and can be version-controlled in git.</P>
    </>
  )
}

function SectionKeyboard() {
  return (
    <>
      <Heading>Keyboard shortcuts</Heading>
      <Table
        headers={['Key', 'Action']}
        rows={[
          ['Delete', 'Delete selected node(s) or edge(s)'],
          ['Escape', 'Close this dialog; cancel label/port editing; blur formula input'],
          ['Enter', 'Confirm port or label rename'],
          ['Double-click label', 'Enter label edit mode'],
        ]}
      />

      <Heading>Tips</Heading>
      <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20, margin: '0 0 14px' }}>
        <li>Drag nodes from their <strong>header bar</strong> — clicking inside a node (on ports or buttons) won't accidentally move it.</li>
        <li>Click the canvas minimap (bottom-right) to jump to any area of a large graph.</li>
        <li>Use the <strong>fit view</strong> button (controls panel, bottom-left) to reset your zoom level.</li>
        <li>In Experiment Mode, lock constants you don't want changed before dragging a back-propagation slider.</li>
      </ul>
    </>
  )
}
