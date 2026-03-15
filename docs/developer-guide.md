# Developer Guide

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash
git clone <repo>
cd Feedback-loop
npm install
npm run dev        # http://localhost:5173
```

## Project Structure

```
Feedback-loop/
├── index.html                          # Vite entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/                               # Documentation
└── src/
    ├── main.tsx                        # React root, imports React Flow CSS
    ├── App.tsx                         # Top-level layout and state wiring
    ├── types/
    │   └── graph.ts                    # All shared TypeScript interfaces
    ├── components/
    │   ├── FlowCanvas.tsx              # <ReactFlow> wrapper
    │   ├── Toolbar.tsx                 # Add Node / Save / Load bar
    │   └── FeedbackNode/
    │       ├── FeedbackNode.tsx        # Custom node component
    │       ├── FeedbackNode.css        # Node styles
    │       └── PortEditor.tsx          # Inline port add/rename/remove UI
    ├── hooks/
    │   ├── useGraphState.ts            # Central nodes + edges state
    │   └── useFilePersistence.ts       # saveGraphToFile / loadGraphFromFile
    └── utils/
        └── serialization.ts            # Pure serialize / deserialize functions
```

---

## Architecture

### Data Flow

```
App.tsx
 └── useGraphState()          ← owns nodes[] and edges[] via React Flow hooks
      ├── FlowCanvas.tsx       ← renders <ReactFlow>, handles onConnect
      │    └── FeedbackNode    ← custom node, calls updateNodeData() directly
      │         └── PortEditor
      └── Toolbar.tsx          ← triggers addNode / save / load
           └── useFilePersistence  ← file I/O (no state of its own)
```

`ReactFlowProvider` wraps `App` so that any component can call `useReactFlow()` — this is required for `FeedbackNode` and `PortEditor` to call `updateNodeData()` and `deleteElements()` without prop-drilling.

### State ownership

React Flow's internal store is the single source of truth for node positions (it manages drag). Node `data` (label, inputs, outputs) lives inside that same store and is updated via `updateNodeData()`. There is no separate external state for node data.

`useGraphState` wraps `useNodesState` / `useEdgesState` and exposes a minimal interface:

| Export | Purpose |
|--------|---------|
| `nodes`, `edges` | Current graph state (passed to `<ReactFlow>`) |
| `onNodesChange`, `onEdgesChange` | Change handlers for React Flow |
| `setEdges` | Needed by `FlowCanvas` to call `addEdge` on connect |
| `addNode(position)` | Creates a new node with empty ports |
| `getSerializedGraph()` | Snapshot → `SerializedGraph` |
| `loadGraph(graph)` | Replace nodes and edges from a deserialized graph |

---

## Key Files

### `src/types/graph.ts`

All shared interfaces. Change here first before touching anything else.

```ts
interface Port { id: string; label: string }
interface FeedbackNodeData { label: string; inputs: Port[]; outputs: Port[] }
interface SerializedGraph { version: 1; nodes: SerializedNode[]; edges: SerializedEdge[] }
```

`FeedbackNodeData` extends `Record<string, unknown>` (required by React Flow's node data constraint).

### `src/components/FeedbackNode/FeedbackNode.tsx`

The custom node. Key details:

- **Handle positioning**: handles are positioned with `style={{ top: \`${100/(N+1)*(k+1)}%\` }}` so they spread evenly regardless of port count.
- **Handle IDs**: each `<Handle id={port.id}>` — React Flow uses this to resolve edge endpoints. Port IDs must be stable.
- **Label editing**: local `isEditingLabel` state toggles between a `<span>` and `<input>`. On commit, calls `updateNodeData(id, { label })`.
- **Port editor toggle**: `showPortEditor` local state. Renders `<PortEditor>` inline when true.

### `src/components/FeedbackNode/PortEditor.tsx`

Calls `updateNodeData` and `deleteElements` from `useReactFlow()` directly — no prop callbacks needed for mutations. When a port is removed, orphaned edges are found by matching `source`/`target` node ID + handle ID, then deleted in the same operation.

### `src/utils/serialization.ts`

Pure functions, no React dependencies. Safe to unit test in isolation.

- `serializeGraph(nodes, edges)` → picks only the fields needed for persistence, discarding React Flow internals.
- `deserializeGraph(graph)` → adds `type: 'feedbackNode'` back to each node so React Flow renders them with the correct component.

---

## Adding a New Node Type

1. Define a new data interface in `src/types/graph.ts`:
   ```ts
   export interface MyNodeData extends Record<string, unknown> {
     label: string;
     // ... custom fields
   }
   ```
2. Create `src/components/MyNode/MyNode.tsx` following the same pattern as `FeedbackNode`.
3. Register it in `FlowCanvas.tsx`:
   ```ts
   const nodeTypes = useMemo(() => ({
     feedbackNode: FeedbackNode,
     myNode: MyNode,
   }), [])
   ```
4. Update `useGraphState.addNode` (or add a new `addMyNode`) to create nodes with `type: 'myNode'`.
5. Update `serialization.ts` to handle the new type in `deserializeGraph`.

---

## Extending the File Format

If you need to add fields to the saved format:

1. Bump the version in `SerializedGraph`:
   ```ts
   interface SerializedGraph { version: 2; ... }
   ```
2. Update `serializeGraph` to include the new fields.
3. Update `deserializeGraph` to read them.
4. In `loadGraphFromFile` (`useFilePersistence.ts`), add a migration branch:
   ```ts
   if (parsed.version === 1) parsed = migrateV1toV2(parsed)
   ```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot module replacement |
| `npm run build` | Run `tsc` type-check then Vite production build → `dist/` |
| `npm run preview` | Serve the `dist/` build locally for production testing |
