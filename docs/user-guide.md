# User Guide

## Interface Overview

```
┌─────────────────────────────────────────────────┐
│  Feedback Loop   [+ Add Node]      [Save JSON] [Load JSON]  ← Toolbar
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌───────────────────┐                         │
│ ○─┤ Production   Edit ├─○                       │
│   │ demand signal     │ goods produced          │
│   │ Converts inputs…  │ (description)           │
│   │ out = in * 0.8    │ (formula)               │
│   └───────────────────┘                         │
│                          ┌──────────────────┐   │
│                        ○─┤ Inventory   Edit ├─○ │
│                          │ goods received   │   │
│                          └──────────────────┘   │
│                                       [minimap] │
│                                  [zoom controls]│
└─────────────────────────────────────────────────┘
```

The toolbar runs across the top. The canvas fills the rest of the window.

---

## Nodes

### Adding a Node

Click **+ Add Node** in the toolbar. A new node titled "New Node" appears near the centre of the current viewport. If you add multiple nodes quickly they are offset slightly so they do not stack on top of each other.

### Moving a Node

Click and drag the node body to reposition it anywhere on the canvas.

### Renaming a Node

Double-click the node's title text. An inline text field appears. Type the new name, then press **Enter** or click away to confirm. Press **Escape** to cancel.

---

## Description

Each node has an optional free-text **Description** field explaining what it represents. When set, it is displayed below the port list when the editor panel is closed.

---

## Output Formulas

Each **output port** can have its own formula defining how it is computed from inputs and variables. Formulas are real expressions that the tool evaluates, not just documentation strings.

### Writing a Formula

Open the Edit panel on a node. Each output port shows a `=` prefix followed by a formula input (monospace). Type a mathematical expression using:

- **Input port names** — written as their label with spaces replaced by underscores. For example, an input labelled `demand signal` is referenced as `demand_signal`.
- **Named variables** — constants you define in the Variables section (see below).
- **Operators** — `+`, `-`, `*`, `/`, `^` (power), and parentheses.
- **Math functions** — `sqrt(x)`, `abs(x)`, `min(a, b)`, `max(a, b)`, `floor(x)`, `ceil(x)`, etc.

Example: inputs `a` and `b`, formula `a / b * 5` → when `a` and `b` have values the output shows `= 2.5`.

A hint line below each formula input lists all currently available variable names.

### Formula Display

When the editor is closed, each output port row shows its formula inline as a small green pill:

| Situation | Display |
|-----------|---------|
| All referenced variables have values | `= 3.14` (computed result) |
| Some variables are symbolic (e.g. input port values unknown) | `= a / b * 5` (formula text) |
| Syntax error in the expression | `⚠` (hover to see the error message) |

### Variables

The **Variables** section in the Edit panel lets you define named numeric constants for the node. For example, define `alpha = 0.8` and then write `demand_signal * alpha` as an output formula. All formulas on the node share the same variable definitions.

Each variable needs:
- A **name**: a valid identifier (letters, digits, underscores; must not start with a digit).
- A **value**: a number.

---

## Ports

Ports are the named connection points on each node. **Input ports** appear on the left side; **output ports** appear on the right side.

### Opening the Edit Panel

Click the **Edit** button on any node. A panel expands below the node body containing: Description, Variables, Inputs, and Outputs (with per-port formula inputs).

### Adding a Port

Inside the port editor, click **+ Add** under either the **Inputs** or **Outputs** section. A new port is created with a default name (`in1`, `in2`, … or `out1`, `out2`, …).

### Renaming a Port

Click directly into the port's name field in the port editor and type a new name. Changes take effect immediately.

### Removing a Port

Click the **✕** button next to a port. The port is removed and any arrows that were connected to it are automatically deleted.

### Closing the Port Editor

Click **Done** (the button toggles between "Edit" and "Done").

---

## Connections (Arrows)

Connections represent directed relationships from an output port to an input port.

### Drawing a Connection

1. Hover over an output handle — the small circle on the **right** side of a node, aligned with an output port label. The circle highlights blue.
2. Click and drag from the output handle toward an input handle on another node (or the same node).
3. Release over an input handle (left side circle) to complete the connection.

Connections can only go **from an output to an input** — React Flow enforces this automatically.

### Deleting a Connection

Click an arrow to select it (it highlights), then press **Delete**.

You can also remove all connections to a port by deleting the port itself (see above).

---

## Canvas Navigation

| Action | How |
|--------|-----|
| Pan | Click and drag the canvas background |
| Zoom in/out | Scroll wheel, or use the **+**/**−** controls (bottom-left) |
| Fit all nodes in view | Click the **⊡** fit-view button in the controls |
| Minimap | Bottom-right corner — click to jump to a location |

---

## Saving and Loading

### Saving a Diagram

Click **Save JSON** in the toolbar. Your browser downloads a file named `feedback-loop.json`. This file contains the complete diagram — all nodes, their positions, port definitions, and all connections.

### Loading a Diagram

Click **Load JSON** in the toolbar, then pick a previously saved `.json` file. The canvas is replaced with the loaded diagram.

> **Note:** Loading a file replaces everything currently on the canvas. Save first if you want to keep your current work.

### The JSON File

The file is plain text and human-readable. You can open it in any text editor. See [file-format.md](file-format.md) for the full schema.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` | Delete selected node(s) or edge(s) |
| `Escape` | Cancel label editing |
| `Enter` | Confirm label editing |

---

## Tips

- **Feedback loops**: connect an output of a downstream node back to an input of an upstream node to represent a feedback relationship.
- **Multiple outputs**: a single output port can connect to multiple input ports — just draw additional arrows from it.
- **Overlapping nodes**: if nodes overlap after loading or adding many nodes, drag them apart or use the fit-view button to see the full diagram.
