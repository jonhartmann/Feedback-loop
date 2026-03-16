export interface Port {
  id: string;
  label: string;
}

export interface OutputPort extends Port {
  formula?: string;   // expression, e.g. "a / b * 5"
}

export interface NodeVariable {
  name: string;       // valid JS identifier, e.g. "alpha"
  value: number;
}

export interface FeedbackNodeData extends Record<string, unknown> {
  label: string;
  inputs: Port[];
  outputs: OutputPort[];
  description?: string;
  variables?: NodeVariable[];   // user-defined named constants
  formula?: string;             // DEPRECATED — read-only for migration
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
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}
