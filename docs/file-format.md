# File Format

Diagrams are saved as UTF-8 JSON. The top-level object is a `SerializedGraph`.

## Top-Level Object

```jsonc
{
  "version": 1,        // Always 1 for this format version
  "nodes": [ ... ],    // Array of SerializedNode
  "edges": [ ... ]     // Array of SerializedEdge
}
```

The `version` field exists for forward compatibility. A loader must reject (or warn about) files where `version !== 1`.

---

## SerializedNode

```jsonc
{
  "id": "node-<uuid>",          // Unique node identifier
  "position": {
    "x": 150,                   // Canvas X coordinate (pixels, can be negative)
    "y": 200                    // Canvas Y coordinate (pixels, can be negative)
  },
  "data": {
    "label": "Production",      // Display name shown in the node header
    "inputs": [ ... ],          // Array of Port (left-side handles)
    "outputs": [ ... ]          // Array of Port (right-side handles)
  }
}
```

---

## Port

```jsonc
{
  "id": "in-<uuid>",            // Stable unique identifier — never changes even if label is renamed
  "label": "demand signal"      // User-visible name displayed inside the node
}
```

Port IDs are stable UUIDs. Edge `sourceHandle` / `targetHandle` reference these IDs, so renaming a port label never breaks existing connections.

---

## SerializedEdge

```jsonc
{
  "id": "edge-<uuid>",          // Unique edge identifier
  "source": "node-<uuid>",      // ID of the source node
  "sourceHandle": "out-<uuid>", // ID of the output port on the source node
  "target": "node-<uuid>",      // ID of the target node
  "targetHandle": "in-<uuid>"   // ID of the input port on the target node
}
```

An edge always goes from an **output** port to an **input** port. Both `sourceHandle` and `targetHandle` must match a port `id` in the respective node's `outputs` / `inputs` arrays.

---

## Full Example

```json
{
  "version": 1,
  "nodes": [
    {
      "id": "9f3a1c2d-0000-0000-0000-000000000001",
      "position": { "x": 150, "y": 200 },
      "data": {
        "label": "Production",
        "inputs": [
          { "id": "a1b2c3d4-0000-0000-0000-000000000001", "label": "demand signal" },
          { "id": "a1b2c3d4-0000-0000-0000-000000000002", "label": "inventory level" }
        ],
        "outputs": [
          { "id": "e5f6a7b8-0000-0000-0000-000000000001", "label": "goods produced" }
        ]
      }
    },
    {
      "id": "9f3a1c2d-0000-0000-0000-000000000002",
      "position": { "x": 500, "y": 200 },
      "data": {
        "label": "Inventory",
        "inputs": [
          { "id": "c9d0e1f2-0000-0000-0000-000000000001", "label": "goods received" }
        ],
        "outputs": [
          { "id": "c9d0e1f2-0000-0000-0000-000000000002", "label": "stock level" }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-0000-0000-0000-000000000001",
      "source": "9f3a1c2d-0000-0000-0000-000000000001",
      "sourceHandle": "e5f6a7b8-0000-0000-0000-000000000001",
      "target": "9f3a1c2d-0000-0000-0000-000000000002",
      "targetHandle": "c9d0e1f2-0000-0000-0000-000000000001"
    },
    {
      "id": "edge-0000-0000-0000-000000000002",
      "source": "9f3a1c2d-0000-0000-0000-000000000002",
      "sourceHandle": "c9d0e1f2-0000-0000-0000-000000000002",
      "target": "9f3a1c2d-0000-0000-0000-000000000001",
      "targetHandle": "a1b2c3d4-0000-0000-0000-000000000002"
    }
  ]
}
```

This example encodes a simple feedback loop: Production → Inventory → (stock level back to) Production.

---

## Constraints

- `version` must be `1`
- `nodes[].id` must be unique across all nodes
- `edges[].id` must be unique across all edges
- `edges[].sourceHandle` must match a port `id` in the source node's `outputs` array
- `edges[].targetHandle` must match a port `id` in the target node's `inputs` array
- Port `id` values must be unique within a node (inputs and outputs share a namespace per node)
