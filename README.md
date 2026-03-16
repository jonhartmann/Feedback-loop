# Feedback Loop Diagram Tool

A browser-based graphical editor for building feedback loop and process diagrams. Create labeled nodes, define named inputs and outputs on each node, connect them with arrows, and save/load diagrams as JSON files.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

- **Drag-and-drop canvas** — pan, zoom, and freely reposition nodes
- **Custom nodes** with editable labels and dynamic named ports
- **Directed connections** — draw arrows from output ports to input ports
- **JSON persistence** — save and restore full diagrams as `.json` files
- **Keyboard delete** — select an edge or node and press `Delete` to remove it

## Usage

See [docs/user-guide.md](docs/user-guide.md) for full instructions.

| Action | How |
|--------|-----|
| Add a node | Click **+ Add Node** in the toolbar |
| Rename a node | Double-click its title |
| Add/rename/remove ports | Click **Ports** on any node |
| Draw a connection | Drag from an output handle (right) to an input handle (left) |
| Delete a node or edge | Select it, press `Delete` |
| Save diagram | Click **Save JSON** — downloads `feedback-loop.json` |
| Load diagram | Click **Load JSON** — pick a previously saved `.json` file |

## Development

```bash
npm run dev      # Start dev server with HMR
npm run build    # Type-check and build for production
npm run preview  # Preview the production build locally
```

See [docs/developer-guide.md](docs/developer-guide.md) for architecture details and how to extend the tool.

## File Format

Diagrams are saved as versioned JSON. See [docs/file-format.md](docs/file-format.md) for the full schema.

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool
- [React 18](https://react.dev/) — UI framework
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [@xyflow/react](https://reactflow.dev/) — node graph engine
