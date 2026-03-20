import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { useSimContext } from '../context/SimContext'
import { useUnitMap } from '../context/GraphEvalContext'
import { formatValue } from '../utils/formulaEval'
import './DeletableEdge.css'

export default function DeletableEdge(props: EdgeProps & { sourceHandle?: string | null }) {
  const {
    id,
    source,
    sourceHandle = null,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    selected,
  } = props
  const { deleteElements } = useReactFlow()
  const { simMode, deltaMap } = useSimContext()
  const unitMap = useUnitMap()

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Delta is keyed by the source port — the value flowing through this edge
  const edgeKey = sourceHandle ? `${source}:${sourceHandle}` : null
  const delta = edgeKey ? deltaMap.get(edgeKey) : undefined
  const unit = edgeKey ? unitMap.get(edgeKey) : undefined

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={20}
      />
      {!simMode && selected && (
        <EdgeLabelRenderer>
          <button
            className="edge-delete-btn"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            onClick={() => deleteElements({ edges: [{ id }] })}
            title="Delete connection"
          >
            ✕
          </button>
        </EdgeLabelRenderer>
      )}
      {simMode && delta !== undefined && (
        <EdgeLabelRenderer>
          <span
            className={`edge-delta-badge${delta > 0 ? ' positive' : delta < 0 ? ' negative' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            {delta > 0 ? '+' : ''}{formatValue(delta, unit)}
          </span>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
