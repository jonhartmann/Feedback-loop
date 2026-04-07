import type { Node, Edge } from '@xyflow/react'
import type { FeedbackNodeData, SerializedGraph, SerializedNode, SerializedEdge, NodeVariant, InputPort, OutputPort } from '../types/graph'
import { METRIC_PORT_ID } from '../types/graph'
import { toCamelCase, labelToVarName } from './formulaEval'

export function serializeGraph(
  nodes: Node<FeedbackNodeData>[],
  edges: Edge[],
  name?: string,
): SerializedGraph {
  const serializedNodes: SerializedNode[] = nodes.map(n => ({
    id: n.id,
    position: { x: n.position.x, y: n.position.y },
    data: {
      label: n.data.label,
      ...(n.data.variant && { variant: n.data.variant }),
      inputs: n.data.inputs,
      outputs: n.data.outputs,
      ...(n.data.displayMode !== undefined && { displayMode: n.data.displayMode }),
      ...(n.data.seriesChartType !== undefined && { seriesChartType: n.data.seriesChartType }),
      // legacy n.data.formula is intentionally not written
    },
  }))

  const serializedEdges: SerializedEdge[] = edges.map(e => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle ?? '',
    target: e.target,
    targetHandle: e.targetHandle ?? '',
  }))

  return { version: 1, ...(name ? { name } : {}), nodes: serializedNodes, edges: serializedEdges }
}

export function deserializeGraph(graph: SerializedGraph): {
  nodes: Node<FeedbackNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<FeedbackNodeData>[] = graph.nodes.map(n => {
    const raw = n.data as Record<string, unknown>
    const variant = (raw.variant ?? 'expression') as NodeVariant

    let inputs: InputPort[] = (raw.inputs as InputPort[] | undefined) ?? []
    let outputs: OutputPort[] = (raw.outputs as OutputPort[] | undefined) ?? []

    // ── Migration: metricFormula / metricUnit → output port ──────────────────
    const metricFormula = raw.metricFormula as string | undefined
    const metricUnit = raw.metricUnit as ('number' | 'money' | 'percent') | undefined
    if (variant === 'metric' && metricFormula !== undefined && !outputs.some(p => p.id === METRIC_PORT_ID)) {
      outputs = [
        ...outputs,
        { id: METRIC_PORT_ID, label: 'value', formula: metricFormula, ...(metricUnit ? { unit: metricUnit } : {}) },
      ]
    }

    // ── Migration: node-level sourceUrl / outputs[0].value → InputPort ───────
    const legacySourceUrl = raw.sourceUrl as string | undefined
    if (variant === 'measure' && inputs.length === 0) {
      const portLabel = toCamelCase(raw.label as string) || 'value'
      const legacyValue = (outputs[0] as OutputPort | undefined)?.value
      inputs = [{
        id: crypto.randomUUID(),
        label: portLabel,
        ...(legacySourceUrl !== undefined ? { sourceUrl: legacySourceUrl } : {}),
        ...(legacyValue !== undefined ? { value: legacyValue } : {}),
      }]
      // Ensure the output has an identity formula pointing at the input variable
      if (outputs.length === 0) {
        outputs = [{ id: crypto.randomUUID(), label: portLabel, formula: labelToVarName(portLabel) }]
      } else {
        outputs = outputs.map((p, i) =>
          i === 0 ? { ...p, value: undefined, formula: p.formula ?? labelToVarName(portLabel) } : p
        )
      }
    }

    return {
      id: n.id,
      type: 'feedbackNode',
      position: n.position,
      dragHandle: '.feedback-node__header',
      data: {
        label: raw.label as string,
        variant,
        inputs,
        outputs,
        ...(raw.displayMode !== undefined && { displayMode: raw.displayMode as 'value' | 'series' }),
        ...(raw.seriesChartType !== undefined && { seriesChartType: raw.seriesChartType as 'line' | 'area' | 'bar' }),
        // legacy formula, description, variables, metricFormula, metricUnit, sourceUrl silently dropped
      },
    }
  })

  const edges: Edge[] = graph.edges.map(e => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle || null,
    target: e.target,
    targetHandle: e.targetHandle || null,
  }))

  return { nodes, edges }
}
