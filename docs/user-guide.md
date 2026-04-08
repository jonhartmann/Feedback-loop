# User Guide

## Interface Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│ Untitled ▏ [+Const] [+Measure] [+Expr] [+Metric]  [Experiment]  [Templates] [Library] ▏ [Help] [Save] [Load]
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────────┐      ┌──────────────────────────────┐   │
│   │ Constant                │      │ Expression                   │   │
│   │ 0             $ ○──────────────→ a                    42.00 ○ │   │
│   └─────────────────────────┘      │ b              out1 = a+b ○ │   │
│                                    └──────────────────────────────┘   │
│                                                           [minimap]    │
│                                                      [zoom controls]   │
└────────────────────────────────────────────────────────────────────────┘
```

The toolbar runs across the top. The canvas fills the rest of the window. The document name field is at the far left of the toolbar; **Experiment** floats in the center; **Templates**, **Library**, **Help**, **Save**, and **Load** are grouped on the right.

---

## Node Types

There are four node types, each created from the toolbar.

### Constant
A fixed number you set manually — interest rates, headcount, price, etc. Has one output port. When expanded: shows a number input and a unit dropdown (`number` / `money` / `percent`).

### Measure
Fetches its value from an external URL on a 3-second polling interval. Like a Constant, but live. When expanded: shows a numeric value input (for manual override) and a **URL** field (e.g. `/api/range?min=0&max=100`). The input port accepts a connected value from another node, which overrides the fetched value. Defaults to **Area Graph** display mode on creation.

### Expression
A computation node with one or more inputs and one or more outputs. Each output has its own formula. Input port labels become the variable names you write in formulas. Use it for intermediate calculations.

### Metric
A KPI node with multiple inputs and a single headline formula. Use it for the final results you want to highlight — revenue targets, ratios, totals.

---

## Adding Nodes

**Click** a toolbar button (`+ Constant`, `+ Measure`, `+ Expression`, `+ Metric`) to add a node at the centre of the current viewport. Nodes placed quickly are offset slightly so they do not stack.

**Drag** a toolbar button onto the canvas to drop the node at a specific position.

---

## Moving Nodes

Drag a node from its **header bar** (the title area at the top of the node). Clicking anywhere else on the node body — ports, inputs, formulas — will not move it.

---

## Renaming a Node

Double-click the node's title text. An inline text field appears. Type the new name, then press **Enter** or click away to confirm. Press **Escape** to cancel.

---

## Node Header Buttons

Three buttons are revealed in the header when you hover over a node:

| Button | Action |
|--------|--------|
| Display mode dropdown (∿ / ◿ / ▮▮) | Switch between Current Value, Area Graph, and Bar Graph (see Series Mode) |
| ☆ | Save the node as a reusable Library template |
| ✕ | Delete the node and all its connections |

The display mode dropdown only appears on Measure nodes and on nodes that are downstream of a Measure.

---

## Ports

**Input ports** appear on the left side; **output ports** appear on the right side.

### Renaming a Port

Click directly on the port label and type a new name, then press **Enter** or click away. The new name immediately becomes the variable name in any formula that references it (underscores replace spaces; non-alphanumeric characters become underscores; a leading digit gets a `_` prefix). Connected formulas update automatically.

### Adding Ports

Drag a connection from any output and release it over an Expression or Metric node's body (not a specific handle) — a new input port is created and connected automatically. A dashed sentinel handle also appears near the bottom of the inputs column while a drag is in progress; dropping there has the same effect.

### Reordering Ports

Grab the **⠿ drag handle** to the left of any port label and drag it up or down to reorder.

### Removing a Port

Click the **✕** button that appears when hovering a port. The port is removed and any edges connected to it are automatically deleted.

---

## Formulas

Each output port on an Expression or Metric node can have a formula. Formulas are evaluated in real time using [mathjs](https://mathjs.org/) with a restricted scope.

### Variable Names

Input port labels are converted to variable names by `labelToVarName()`:
- Spaces → `_` (e.g. `demand signal` → `demand_signal`)
- Non-alphanumeric characters → `_` (e.g. `input #1` → `input__1`)
- Leading digit → prefixed with `_` (e.g. `2x` → `_2x`)

The hint line below each formula input shows the exact variable names available: e.g. `Vars: demand_signal, price`.

When you connect a **Constant** or **Measure** node to an input port the input port is automatically renamed to match the source node's label (camelCased), and any formula referencing the old variable name is updated automatically.

### Writing a Formula

Type a mathematical expression using variable names, operators (`+`, `-`, `*`, `/`, `^`), and built-in functions:

```
# Ratio
conversions / visits

# Conditional guard
if(denominator == 0, 0, numerator / denominator)

# Compound interest
principal * pow(1 + rate, years)

# Clamp to range
min(max(value, 0), 100)
```

### Built-in Functions

| Category | Functions |
|----------|-----------|
| Arithmetic | `abs`, `sqrt`, `pow`, `mod`, `sign` |
| Rounding | `round`, `floor`, `ceil` |
| Comparison | `min`, `max` |
| Aggregation | `sum`, `mean` |
| Logarithm | `log`, `log2`, `log10`, `exp` |
| Conditional | `if(condition, thenValue, elseValue)` |
| Trigonometry | `sin`, `cos`, `tan`, `atan2` |
| Constants | `pi`, `e`, `Infinity` |

### Formula Display States

| Display | Meaning |
|---------|---------|
| `= 42.00` | Evaluated successfully |
| `= formula_text` | Valid formula but some upstream inputs have no value yet — shown as a text preview |
| `⚠ message` | Syntax error or evaluation failed |

---

## Units

Every output port has a unit that controls how its value is displayed.

| Unit | Format | Example |
|------|--------|---------|
| `number` | Plain decimal with commas | `42,300` |
| `money` | Dollar sign with cents | `$42,300.00` |
| `percent` | Stored as decimal, displayed as % | `0.425 → 42.5%` |

Click the **unit button** (`#` / `$` / `%`) on any output port to open a dropdown and select **Number**, **Money**, or **Percent**.

When a port has no explicit unit it infers one from its upstream connections: `money` beats everything; `percent` only propagates when all inputs are `percent`; otherwise `number`.

---

## Connections

Connections represent directed relationships from an output port to an input port.

### Drawing a Connection

Hover over an output handle (right side of a node) until it highlights, then drag toward an input handle (left side of another node) and release to complete the connection.

If you release over the body of another node (not a specific handle), a new input port is created on that node automatically.

If you release over empty canvas space, a new Expression node is created with a matching port and connected automatically.

### Reconnecting

Drag from an occupied **input** handle to move the existing connection to a new target. The original edge is lifted and you can drop it on any input handle or empty space.

### Deleting a Connection

Click an edge to select it, then press **Delete**.

---

## Canvas Navigation

| Action | How |
|--------|-----|
| Pan | Click and drag on empty canvas space |
| Zoom | Scroll wheel, or the **+** / **−** buttons (bottom-left) |
| Fit view | Fit-view button in the controls panel (bottom-left) |
| Minimap | Bottom-right corner — click to jump to a location |
| Select | Click a node or edge |
| Multi-select | Click and drag a selection rectangle on the canvas |
| Delete | Select node(s) or edge(s) and press **Delete** |

---

## Experiment Mode (What-If)

Click **Experiment** in the toolbar to enter simulation mode. Every node gains a **sim slider** showing its current value and a percentage delta from the baseline.

**Constants and Measures** — drag the slider to scale the value from −80% to +400%. The change propagates forward through all downstream nodes in real time.

**Expressions and Metrics** — set a target percentage. Feedback Loop works *backwards* to find what upstream Constant values need to change, then distributes the required adjustment proportionally across all unlocked constants.

**Locking** — click the lock icon on a Constant's slider to exclude it from back-propagation. Only unlocked constants absorb a distributed change.

Toggle **Experiment** off to discard all simulation overrides and return to the baseline graph.

---

## Series Mode (Timeline Charts)

Measure nodes and any node **downstream of a Measure** can display their primary output as a chart over time. The option is not available on isolated formula nodes.

Click the **display mode dropdown** (∿ / ◿ / ▮▮) in the node header (visible on hover) and choose:

| Option | Description |
|--------|-------------|
| Current Value (∿) | Shows only the live number (default) |
| Area Graph (◿) | Filled area chart of the last 20 values |
| Bar Graph (▮▮) | Bar chart of the last 20 values |

When you switch to Area or Bar graph, the chart is pre-populated from a rolling buffer of up to 20 values that have already been recorded — so the chart is not blank on first activation.

---

## Library

Click **Library** in the toolbar to open the right-side panel. It contains reusable node templates organized by type.

**Built-in templates include:**
- Math Constants (π, e, √2, φ, ln(2), ln(10))
- Web Performance Measures (Page Load Time, LCP, CLS, Conversion Rate, etc.)
- Expressions (Clamp, Safe Divide, Round to Step, Log Scale, Weighted Average)
- Metrics (Monthly Revenue, Customer LTV, Acquisition Cost, Retention Rate, NPS)

### Adding from the Library

- **Click** an item to add a copy at the centre of the canvas.
- **Drag** an item onto the canvas and drop it at the position you want.

### Saving a Node to the Library

Hover over any node to reveal the **☆ button** in its header. Click it to save the node's current configuration — label, ports, and formulas — as a reusable template. It appears under the appropriate type section in the Library.

### Managing Library Items

Each saved item has a **✕** button to delete it. Click the **↺ Reset** button in the library header to restore the built-in defaults (confirmation required). Library items are stored in `localStorage` and persist between sessions.

---

## Templates

Click **Templates** in the toolbar to open the template picker. Select a starter graph to load a pre-built example onto the canvas.

> **Note:** Loading a template replaces the current canvas. Save your work first.

---

## Saving and Loading

### Document Name

The text field at the left of the toolbar sets your document name (default: "Untitled"). This name is used as the filename when saving.

### Saving

Click **Save** to download your graph as `{document name}.json`. The file contains all nodes, positions, port definitions, formulas, and edges.

### Loading

Click **Load** to open a file picker and import a previously saved `.json` file. The current canvas is replaced.

> **Tip:** Graph files are plain JSON and can be stored in version control.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` | Delete selected node(s) or edge(s) |
| `Escape` | Cancel label or port editing; close modal dialogs |
| `Enter` | Confirm label or port rename |
| `Double-click label` | Enter label edit mode |
