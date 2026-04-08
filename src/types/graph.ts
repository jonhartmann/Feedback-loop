export type NodeVariant = 'constant' | 'measure' | 'metric' | 'expression'
export type Unit = 'number' | 'money' | 'percent'

/** Sentinel port ID used for metric nodes — stored as the output port's id. */
export const METRIC_PORT_ID = '__metric' as const

export interface Port {
  id: string;
  label: string;
}

/** Input port — may carry a source URL and/or a direct value (measure nodes). */
export interface InputPort extends Port {
  sourceUrl?: string;
  value?: number;
}

export interface OutputPort extends Port {
  formula?: string;   // expression, e.g. "a / b * 5"
  value?: number;     // direct value set on constant nodes
  unit?: Unit;        // explicit unit; if absent, inferred from upstream inputs
}

// Extends Record<string, unknown> to satisfy React Flow's Node<T> constraint.
export interface FeedbackNodeData extends Record<string, unknown> {
  label: string;
  variant?: NodeVariant;        // undefined only in legacy/unmigrated data; normalized to 'expression' on load
  inputs: InputPort[];
  outputs: OutputPort[];
  formula?: string;             // DEPRECATED — read-only for migration
  displayMode?: 'value' | 'series';
  seriesChartType?: 'line' | 'area' | 'bar';
  invertSimHighlight?: boolean;  // false/undefined = higher is better (green); true = lower is better (green)
}

export interface NodeTemplate {
  label: string;
  variant?: NodeVariant;
  inputs?: InputPort[];
  outputs?: OutputPort[];
  value?: number;         // shorthand: initial outputs[0].value on creation (constant nodes)
  displayMode?: 'value' | 'series';
  seriesChartType?: 'line' | 'area' | 'bar';
  invertSimHighlight?: boolean;
}

export interface LibraryItem {
  id: string;
  label: string;          // display name in the library panel
  category?: string;      // retained for localStorage compat; grouping is by entity type
  template: NodeTemplate;
}

export interface SerializedNode {
  id: string;
  position: { x: number; y: number };
  data: FeedbackNodeData;
}

export interface SerializedEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface SerializedGraph {
  version: 1;
  name?: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}
