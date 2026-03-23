import type { FeedbackNodeData, NodeTemplate } from '../types/graph'

/** Converts live node data into a reusable NodeTemplate (for the library). */
export function nodeDataToTemplate(data: FeedbackNodeData): NodeTemplate {
  return {
    label: data.label,
    variant: data.variant,
    value: data.outputs[0]?.value,
    unit: data.outputs[0]?.unit ?? data.metricUnit,
    sourceUrl: data.sourceUrl,
    inputs: data.inputs,
    outputs: data.outputs,
    variables: data.variables,
    metricFormula: data.metricFormula,
    metricUnit: data.metricUnit,
    description: data.description,
  }
}
