# Feedback Loop — User Tutorial

Feedback Loop is a visual node-based tool for building evaluatable models. Connect constants, formulas, and metrics into a live graph that recalculates instantly as you change inputs — and run "what-if" experiments to reverse-engineer the inputs needed to hit a target.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [The Canvas](#2-the-canvas)
3. [Node Types](#3-node-types)
4. [Connecting Nodes](#4-connecting-nodes)
5. [Writing Formulas](#5-writing-formulas)
6. [Units](#6-units)
7. [Editing Ports](#7-editing-ports)
8. [Experiment Mode (What-If / Back-Propagation)](#8-experiment-mode-what-if--back-propagation)
9. [Series Mode (Timeline View)](#9-series-mode-timeline-view)
10. [The Library](#10-the-library)
11. [Saving and Loading](#11-saving-and-loading)
12. [Keyboard Shortcuts](#12-keyboard-shortcuts)

---

## 1. Getting Started

When you open Feedback Loop for the first time, a welcome screen appears with four starter templates:

| Template | What it shows |
|---|---|
| **Blank Canvas** | Empty graph — start from scratch |
| **Compounding Interest Calculator** | Multi-step formula flow (Principal → Final Amount) |
| **Website Metrics Flow** | Marketing funnel (Visitors → Revenue) |
| **Business KPI Relationships** | LTV:CAC ratio model for SaaS health |

Click any card to load the template onto the canvas. You can return to this screen at any time via the **Templates** button in the top-right toolbar.

---

## 2. The Canvas

The canvas is your workspace. It supports:

- **Pan** — click and drag on empty space
- **Zoom** — scroll wheel, or use the controls panel (bottom-left)
- **Fit to view** — click the fit button in the controls panel
- **Minimap** — bottom-right corner; click to jump to any area
- **Delete** — select a node or edge and press `Delete`
- **Multi-select** — click and drag to draw a selection rectangle

Nodes snap to a 20 px grid and can only be dragged from their **header bar** to avoid accidental moves when clicking ports or buttons inside a node.

---

## 3. Node Types

Create nodes from the toolbar at the top of the screen. There are four types:

### Constant (amber)
A fixed number you set manually. Use it for assumptions and parameters — interest rates, headcount, price per unit, etc.

- Has one **output port**
- Value is editable directly on the node
- Supports `number`, `money`, and `percent` units

**When to use:** Any static input that drives your model.

---

### Measure (teal)
Like a Constant, but intended to pull live data from an external source via a URL. The value updates automatically on a 3-second refresh interval.

- Has one **output port** with a `sourceUrl` field
- Useful for integrating real-time data feeds

**When to use:** Dynamic inputs that change over time or come from an API.

---

### Expression (gray)
A computation node with one or more input ports and one or more output ports. Each output has its own formula.

- Inputs become **named variables** in your formulas
- Multiple outputs let you compute several related values in one node
- Use **+ in** and **+ out** quick-add buttons to rapidly extend the node

**When to use:** Intermediate calculations — anything that transforms inputs into derived values.

---

### Metric (violet)
A KPI node with multiple inputs and a single formula that produces a headline result. Think of it as the "final answer" of a branch in your graph.

- No explicit output ports — the metric value itself is the output
- Displays the calculated result prominently
- Assign a unit to control how the value is formatted

**When to use:** Key performance indicators, business targets, final results you want to highlight.

---

## 4. Connecting Nodes

Edges carry values from one node's output port to another node's input port.

1. Hover over an **output port** (right side of a node) — a handle appears.
2. Click and drag from that handle to an **input port** (left side of another node).
3. Release to create the connection.

Once connected, the downstream node's formula can reference the upstream value using the **input port's label as a variable name** (see [Writing Formulas](#5-writing-formulas)).

To **delete an edge**, click it to select it, then press `Delete`.

> **Cycle detection:** The graph will not allow circular connections. If a loop is detected, evaluation stops gracefully rather than hanging.

---

## 5. Writing Formulas

Formulas are written in Expression and Metric nodes using standard math syntax powered by [mathjs](https://mathjs.org/).

### Variable names

Each input port's label is converted to a valid identifier and made available as a variable. For example, an input port labeled **"Monthly Visitors"** becomes `monthlyVisitors` in your formula.

When you start typing in a formula field, an autocomplete dropdown appears showing:
- All available input variable names
- Node-level constants you have defined
- Built-in functions

### Built-in functions

| Category | Functions |
|---|---|
| Arithmetic | `abs`, `sqrt`, `pow`, `mod`, `sign` |
| Rounding | `round`, `floor`, `ceil` |
| Comparison | `min`, `max` |
| Aggregation | `sum`, `mean` |
| Logarithm | `log`, `log2`, `log10`, `exp` |
| Conditional | `if(condition, thenValue, elseValue)` |
| Trigonometry | `sin`, `cos`, `tan`, `atan2` |
| Constants | `pi`, `e`, `Infinity` |

### Examples

```
# Simple calculation
monthlyVisitors * conversionRate

# Compound interest
principal * pow(1 + rate / periods, periods * years)

# Conditional
if(ltv / cac > 3, ltv / cac, 0)

# Rounding to 2 decimal places
round(revenue / customers, 2)
```

### Formula states

| Indicator | Meaning |
|---|---|
| Value shown | Formula evaluated successfully |
| `—` | Formula is valid but upstream inputs are missing (symbolic) |
| `⚠` warning | Formula has a syntax error or evaluation failed |

---

## 6. Units

Every port has a unit: `number`, `money`, or `percent`. Units affect how values are displayed and how they propagate downstream.

| Unit | Display format | Example |
|---|---|---|
| `number` | Plain decimal | `42,300` |
| `money` | Dollar with cents | `$42,300.00` |
| `percent` | Stored as decimal, shown as % | `0.425` → `42.5%` |

### Changing a unit

Click the **unit badge** on any port to cycle through: `number` → `money` → `percent` → `number`.

### Unit inference

When a port doesn't have an explicit unit, it infers one from its upstream connections:
- If any input is `money`, the output is `money`
- If all inputs are `percent`, the output is `percent`
- Otherwise, the output is `number`

---

## 7. Editing Ports

### Inline editing

- **Rename a port** — click its label and type a new name, then press `Enter`
- **Edit a formula** — click the formula field to start editing

### Reordering ports

Grab the **⠿ drag handle** to the left of any port label and drag it up or down to reorder ports within the node.

### Quick-add buttons

In expanded mode, each Expression node shows:
- **+ in** — add a new input port
- **+ const** — add a node-level constant (a named number scoped to this node)
- **+ out** — add a new output port

### Full port editor

Click the **Editor** button that appears when a node is expanded for a comprehensive editing panel covering all port properties: label, formula, value, unit, and more.

### Deleting ports

Open the full port editor and use the delete control, or remove all edges connected to a port and delete it from the port list.

---

## 8. Experiment Mode (What-If / Back-Propagation)

Experiment Mode lets you ask **"what needs to change to hit a target?"** instead of just computing forward from inputs.

### Activating

Click the **Experiment** button (blue) in the toolbar. All nodes gain **sim sliders**.

### Sim sliders

Each slider shows:
- The **current simulated value** (with K/M/B suffix for large numbers)
- A **delta badge** showing percentage change from the baseline
- A **percentage range** from −80% to +400%

### Two modes of adjustment

**Direct override** (on Constant and Measure nodes):
Drag the slider to directly scale the node's value up or down by a percentage. The change propagates forward through all downstream nodes immediately.

**Back-propagation** (on Expression and Metric nodes):
Instead of manually changing a Constant, set a **target** on a downstream metric. The slider computes what upstream Constant values need to change to produce that result, then distributes the required adjustment proportionally across all unlocked upstream constants.

> **Example:** You want 20% more monthly revenue. Set the revenue metric's slider to +20%. Feedback Loop will automatically increase "Monthly Visitors" and other upstream constants to reach that target — without you manually tweaking each one.

### Locking constants

Click the **lock icon** on any Constant's sim slider to exclude it from back-propagation. Locked nodes remain at their baseline value; only unlocked nodes absorb the distributed change.

> **Tip:** Lock "Conversion Rate" (hard to change) and leave "Ad Spend" unlocked to ask "how much more do I need to spend on ads to hit this revenue number?"

### Resetting

Toggle the **Experiment** button off to clear all simulation overrides and return to the baseline graph.

---

## 9. Series Mode (Timeline View)

Any node can track a history of its primary output value over time.

### Activating

Click the **series icon** in the node's header to toggle series mode. The node expands to show a chart.

### Chart types

Click the chart-type icons to switch between:
- **Line** (∿) — continuous trend
- **Area** (◿) — filled trend
- **Bar** (▮▮) — discrete values

The chart stores the last 100 recorded values. Values accumulate as you adjust sliders in Experiment Mode or as Measure nodes refresh.

**When to use:** Watch how a metric responds as you drag a sim slider, or observe how a live data feed fluctuates over time.

---

## 10. The Library

The Library is a reusable component panel accessed via the **Library** button in the toolbar (opens a right sidebar).

### Using library items

- **Click** a library item to add a copy of it to the center of the canvas
- **Drag** a library item onto the canvas and drop it at a specific position

Items are organized by type: Constants, Measures, Expressions, Metrics.

### Saving a node to the library

Right-click a node on the canvas and choose **Save to Library**. The full node configuration — ports, formulas, variables — is saved as a reusable template.

### Managing library items

- **Edit** — click the edit button on any library item to modify its label, type, or defaults
- **New** — click **+ New** to create a library item from scratch via the item form
- **Reset to defaults** — restores the library to the built-in starter items (a confirmation dialog will appear first)

Library items are stored in your browser's `localStorage` and persist between sessions.

---

## 11. Saving and Loading

### Save

Click **Save** in the toolbar. The graph is downloaded as a `.json` file named after your document (editable in the title field next to "Feedback Loop" at the top).

### Load

Click **Load** in the toolbar and select a `.json` file you previously saved. The current canvas is replaced with the loaded graph.

### File format

Saved files are plain JSON with the structure:

```json
{
  "version": 1,
  "name": "My Model",
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

This means saved graphs are human-readable and can be version-controlled in git.

---

## 12. Keyboard Shortcuts

| Key | Action |
|---|---|
| `Delete` | Delete selected node(s) or edge(s) |
| `Escape` | Close welcome overlay; cancel label or port editing; blur formula input |
| `Enter` | Confirm label or port rename |
| Double-click node label | Enter label edit mode |

---

## Worked Example: Building a Revenue Model

Here is a quick walkthrough putting it all together.

1. **Click + Constant** and name it **"Monthly Visitors"**. Set the value to `50000`.
2. **Click + Constant** and name it **"Conversion Rate"**. Set the value to `0.03` and change its unit to `percent`.
3. **Click + Constant** and name it **"Average Order Value"**. Set the value to `85` and change its unit to `money`.
4. **Click + Metric** and name it **"Monthly Revenue"**. Set its unit to `money`.
5. Add three input ports to the Metric node: **visitors**, **rate**, and **aov**.
6. Connect Monthly Visitors → visitors, Conversion Rate → rate, Average Order Value → aov.
7. Write the formula: `visitors * rate * aov`.
8. The Metric immediately shows `$127,500.00`.
9. Click **Experiment**. On the Monthly Revenue metric, drag the slider to +20%.
10. Feedback Loop back-propagates: Monthly Visitors and Average Order Value increase proportionally to reach `$153,000.00`.
11. Lock **Average Order Value** (you can't change pricing). Now only Monthly Visitors absorbs the change — you can see exactly how many more visitors you need.
12. Click **Save** to download your model.
