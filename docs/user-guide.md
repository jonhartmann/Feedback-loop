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

## Description and Formula

Each node has two optional fields that document how it works.

### Description

A free-text note explaining what the node represents or does. Displayed in italic below the port list when set.

### Formula

A text expression describing how inputs are combined to produce outputs. Displayed in a monospace green block below the description when set. The tool does not evaluate the formula — it is documentation only. You can write it in any notation that makes sense for your model, for example:

```
output = demand * 0.8 + safety_stock
stock_level = stock_level[t-1] + goods_received - shipments
```

### Editing

Click **Edit** on any node to open the editor panel. The Description and Formula fields appear at the top. Type directly into the text areas — changes are applied immediately. Click **Done** to collapse the panel.

When the editor is closed, any non-empty description or formula appears as a summary inside the node body.

---

## Ports

Ports are the named connection points on each node. **Input ports** appear on the left side; **output ports** appear on the right side.

### Opening the Port Editor

Click the **Edit** button on any node. A small editor panel expands below the node body, containing the Description, Formula, and port management sections.

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
