import type { FeedbackNodeData, NodeTemplate } from '../types/graph'

/** Converts live node data into a reusable NodeTemplate (for the library). */
export function nodeDataToTemplate(data: FeedbackNodeData): NodeTemplate {
  return {
    label: data.label,
    variant: data.variant,
    value: data.outputs[0]?.value,
    inputs: data.inputs,
    outputs: data.outputs,
    ...(data.displayMode !== undefined && { displayMode: data.displayMode }),
    ...(data.seriesChartType !== undefined && { seriesChartType: data.seriesChartType }),
    ...(data.invertSimHighlight !== undefined && { invertSimHighlight: data.invertSimHighlight }),
  }
}
