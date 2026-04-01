export type NodeVariant = 'constant' | 'measure' | 'metric' | 'expression'
export type Unit = 'number' | 'money' | 'percent'

/** Sentinel port ID used for metric nodes in evalMap / simOverlay keys. */
export const METRIC_PORT_ID = '__metric' as const

export interface Port {
  id: string;
  label: string;
}

export interface OutputPort extends Port {
  formula?: string;   // expression, e.g. "a / b * 5"
  value?: number;     // direct value set on constant/measure nodes
  unit?: Unit;        // explicit unit; if absent, inferred from upstream inputs
}

export interface NodeVariable {
  name: string;       // valid JS identifier, e.g. "alpha"
  value: number;
}

export interface FeedbackNodeData extends Record<string, unknown> {
  label: string;
  variant?: NodeVariant;        // undefined only in legacy/unmigrayed data; normalized to 'expression' on load
  inputs: Port[];
  outputs: OutputPort[];
  description?: string;
  variables?: NodeVariable[];   // user-defined named constants (for formula scope)
  formula?: string;             // DEPRECATED — read-only for migration
  metricFormula?: string;       // metric variant: single formula defining the node's value
  metricUnit?: Unit;            // metric variant: explicit display unit (else inferred)
  sourceUrl?: string;           // measure variant: URL to fetch value from
  displayMode?: 'value' | 'series';              // 'value' (default) or accumulated series
  seriesChartType?: 'area' | 'bar';               // chart type when in series mode
}

export interface NodeTemplate {
  label: string;
  variant?: NodeVariant;
  value?: number;         // initial value for first output (constant/measure)
  unit?: Unit;
  sourceUrl?: string;
  // Full port spec — captured when saving a live node to the library
  inputs?: Port[];
  outputs?: OutputPort[];
  variables?: NodeVariable[];
  metricFormula?: string;
  metricUnit?: Unit;
  description?: string;
  displayMode?: 'value' | 'series';
  seriesChartType?: 'area' | 'bar';
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
