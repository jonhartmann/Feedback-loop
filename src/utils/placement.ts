import type { Node } from '@xyflow/react'
import type { XYPosition } from '@xyflow/react'

export const GRID_SIZE = 20

/** Snap a value to the nearest grid line. */
export const snapToGrid = (v: number): number => Math.round(v / GRID_SIZE) * GRID_SIZE

/** Step between candidate slots in the spiral search (must be a multiple of GRID_SIZE). */
const STEP_X = 240   // slightly wider than a typical node + margin
const STEP_Y = 160   // slightly taller than a typical node + margin

/** Extra clearance added around each existing node when checking overlap. */
const MARGIN = 20

/** Assumed bounding box for an incoming node before it has been measured. */
const ASSUMED_W = 220
const ASSUMED_H = 120

function wouldOverlap(x: number, y: number, existingNodes: Node[]): boolean {
  return existingNodes.some(n => {
    const nw = (n.measured?.width  ?? (n.width  as number | undefined) ?? ASSUMED_W) + MARGIN
    const nh = (n.measured?.height ?? (n.height as number | undefined) ?? ASSUMED_H) + MARGIN
    return (
      x              < n.position.x + nw &&
      x + ASSUMED_W + MARGIN > n.position.x &&
      y              < n.position.y + nh &&
      y + ASSUMED_H + MARGIN > n.position.y
    )
  })
}

/**
 * Find the nearest grid-snapped position to `desired` that does not overlap
 * any node in `existingNodes`.
 *
 * Searches outward in concentric rings (Chebyshev distance) so the new node
 * ends up as close as possible to the intended location.
 */
export function findFreePosition(desired: XYPosition, existingNodes: Node[]): XYPosition {
  const sx = snapToGrid(desired.x)
  const sy = snapToGrid(desired.y)

  if (!wouldOverlap(sx, sy, existingNodes)) return { x: sx, y: sy }

  for (let ring = 1; ring <= 12; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        // Only visit the perimeter of this ring
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue
        const x = snapToGrid(sx + dx * STEP_X)
        const y = snapToGrid(sy + dy * STEP_Y)
        if (!wouldOverlap(x, y, existingNodes)) return { x, y }
      }
    }
  }

  // Fallback (extremely dense graphs): stack to the right of all existing nodes
  const rightEdge = existingNodes.reduce(
    (max, n) => Math.max(max, n.position.x + (n.measured?.width ?? ASSUMED_W)),
    sx,
  )
  return { x: snapToGrid(rightEdge + MARGIN), y: sy }
}
