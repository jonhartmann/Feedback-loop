export interface Port {
  id: string;
  label: string;
}

export interface FeedbackNodeData extends Record<string, unknown> {
  label: string;
  inputs: Port[];
  outputs: Port[];
  description?: string;
  formula?: string;
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
