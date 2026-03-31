import { describe, it, expect } from 'vitest'
import { serializeGraph, deserializeGraph } from '../utils/serialization'
import type { Node, Edge } from '@xyflow/react'
import type { FeedbackNodeData, SerializedGraph } from '../types/graph'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<Node<FeedbackNodeData>> = {}): Node<FeedbackNodeData> {
  return {
    id: 'n1',
    type: 'feedbackNode',
    position: { x: 100, y: 200 },
    dragHandle: '.feedback-node__header',
    data: {
      label: 'Test Node',
      inputs: [],
      outputs: [],
    },
    ...overrides,
  }
}

function makeEdge(overrides: Partial<Edge> = {}): Edge {
  return {
    id: 'e1',
    source: 'n1',
    target: 'n2',
    sourceHandle: 'out-1',
    targetHandle: 'in-1',
    ...overrides,
  }
}

// ── serializeGraph ────────────────────────────────────────────────────────────

describe('serializeGraph', () => {
  it('produces version 1 output', () => {
    const result = serializeGraph([], [], 'My Graph')
    expect(result.version).toBe(1)
  })

  it('includes the graph name when provided', () => {
    const result = serializeGraph([], [], 'My Graph')
    expect(result.name).toBe('My Graph')
  })

  it('omits name when not provided', () => {
    const result = serializeGraph([], [])
    expect(result.name).toBeUndefined()
  })

  it('serializes node position and label', () => {
    const node = makeNode()
    const result = serializeGraph([node], [])
    expect(result.nodes[0].position).toEqual({ x: 100, y: 200 })
    expect(result.nodes[0].data.label).toBe('Test Node')
  })

  it('preserves output port value and unit', () => {
    const node = makeNode({
      data: {
        label: 'Constant',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'p1', label: 'value', value: 42, unit: 'money' }],
      },
    })
    const { nodes } = serializeGraph([node], [])
    expect(nodes[0].data.outputs[0]).toMatchObject({ value: 42, unit: 'money' })
  })

  it('preserves output port formula', () => {
    const node = makeNode({
      data: {
        label: 'Expr',
        inputs: [{ id: 'i1', label: 'x' }],
        outputs: [{ id: 'o1', label: 'result', formula: 'x * 2' }],
      },
    })
    const { nodes } = serializeGraph([node], [])
    expect(nodes[0].data.outputs[0].formula).toBe('x * 2')
  })

  it('serializes metric formula and unit', () => {
    const node = makeNode({
      data: {
        label: 'KPI',
        variant: 'metric',
        inputs: [],
        outputs: [],
        metricFormula: 'a + b',
        metricUnit: 'money',
      },
    })
    const { nodes } = serializeGraph([node], [])
    expect(nodes[0].data.metricFormula).toBe('a + b')
    expect(nodes[0].data.metricUnit).toBe('money')
  })

  it('serializes displayMode and seriesChartType', () => {
    const node = makeNode({
      data: {
        label: 'Series',
        inputs: [],
        outputs: [],
        displayMode: 'series',
        seriesChartType: 'bar',
      },
    })
    const { nodes } = serializeGraph([node], [])
    expect(nodes[0].data.displayMode).toBe('series')
    expect(nodes[0].data.seriesChartType).toBe('bar')
  })

  it('serializes edges with source/target handles', () => {
    const edge = makeEdge()
    const { edges } = serializeGraph([], [edge])
    expect(edges[0]).toEqual({
      id: 'e1',
      source: 'n1',
      target: 'n2',
      sourceHandle: 'out-1',
      targetHandle: 'in-1',
    })
  })

  it('replaces null handles with empty string', () => {
    const edge = makeEdge({ sourceHandle: null, targetHandle: null })
    const { edges } = serializeGraph([], [edge])
    expect(edges[0].sourceHandle).toBe('')
    expect(edges[0].targetHandle).toBe('')
  })
})

// ── deserializeGraph ──────────────────────────────────────────────────────────

describe('deserializeGraph', () => {
  it('reconstructs nodes with type feedbackNode', () => {
    const graph: SerializedGraph = {
      version: 1,
      nodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: { label: 'A', inputs: [], outputs: [] } }],
      edges: [],
    }
    const { nodes } = deserializeGraph(graph)
    expect(nodes[0].type).toBe('feedbackNode')
  })

  it('sets dragHandle on every node', () => {
    const graph: SerializedGraph = {
      version: 1,
      nodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: { label: 'A', inputs: [], outputs: [] } }],
      edges: [],
    }
    const { nodes } = deserializeGraph(graph)
    expect(nodes[0].dragHandle).toBe('.node-header')
  })

  it('round-trips a constant node without data loss', () => {
    const original = makeNode({
      data: {
        label: 'Principal',
        variant: 'constant',
        inputs: [],
        outputs: [{ id: 'p1', label: 'value', value: 10000, unit: 'money' }],
      },
    })
    const serialized = serializeGraph([original], [])
    const { nodes } = deserializeGraph(serialized)

    expect(nodes[0].data.label).toBe('Principal')
    expect(nodes[0].data.variant).toBe('constant')
    expect(nodes[0].data.outputs[0]).toMatchObject({ value: 10000, unit: 'money' })
  })

  it('round-trips a metric node without data loss', () => {
    const original = makeNode({
      data: {
        label: 'Final Amount',
        variant: 'metric',
        inputs: [{ id: 'i1', label: 'principal' }],
        outputs: [],
        metricFormula: 'principal * 2',
        metricUnit: 'money',
      },
    })
    const serialized = serializeGraph([original], [])
    const { nodes } = deserializeGraph(serialized)

    expect(nodes[0].data.metricFormula).toBe('principal * 2')
    expect(nodes[0].data.metricUnit).toBe('money')
    expect(nodes[0].data.inputs[0].label).toBe('principal')
  })

  it('converts empty-string handles back to null on edges', () => {
    const graph: SerializedGraph = {
      version: 1,
      nodes: [],
      edges: [{ id: 'e1', source: 'a', target: 'b', sourceHandle: '', targetHandle: '' }],
    }
    const { edges } = deserializeGraph(graph)
    expect(edges[0].sourceHandle).toBeNull()
    expect(edges[0].targetHandle).toBeNull()
  })

  it('preserves edge handle IDs when present', () => {
    const graph: SerializedGraph = {
      version: 1,
      nodes: [],
      edges: [{ id: 'e1', source: 'a', target: 'b', sourceHandle: 'out-1', targetHandle: 'in-1' }],
    }
    const { edges } = deserializeGraph(graph)
    expect(edges[0].sourceHandle).toBe('out-1')
    expect(edges[0].targetHandle).toBe('in-1')
  })

  it('defaults missing inputs/outputs arrays to []', () => {
    const graph: SerializedGraph = {
      version: 1,
      nodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: { label: 'A' } as FeedbackNodeData }],
      edges: [],
    }
    const { nodes } = deserializeGraph(graph)
    expect(nodes[0].data.inputs).toEqual([])
    expect(nodes[0].data.outputs).toEqual([])
  })
})
