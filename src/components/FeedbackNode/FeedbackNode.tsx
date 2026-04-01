import { useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import type { Node, NodeProps } from '@xyflow/react'
import { useReactFlow, useStore } from '@xyflow/react'
import type { FeedbackNodeData } from '../../types/graph'
import { METRIC_PORT_ID } from '../../types/graph'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import { useSimContext } from '../../context/SimContext'
import { SimSliders } from './SimSliders'
import { useDragDropPort } from './useDragDropPort'
import { usePortEditing } from './usePortEditing'
import { NodeContext } from './NodeContext'
import { ValueNodeBody } from './ValueNodeBody'
import { MetricNodeBody } from './MetricNodeBody'
import { ExpressionNodeBody } from './ExpressionNodeBody'
import { NodeHeader } from './NodeHeader'
import { useNodeActions } from './useNodeActions'
import './FeedbackNode.css'


export default function FeedbackNode({ id, data, selected }: NodeProps<Node<FeedbackNodeData>>) {
  const nodeData = data as FeedbackNodeData
  const variant = nodeData.variant
  const isValueNode = variant === 'constant' || variant === 'measure'
  const isMetric = variant === 'metric'

  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(nodeData.label)

  const { updateNodeData } = useReactFlow()
  const evalMap = useEvalMap()
  const unitMap = useUnitMap()
  const { simMode, simOverlay, setSimValue, removeSimValue, simEvalMap } = useSimContext()

  const activeEvalMap = simMode ? simEvalMap : evalMap

  const inputs = nodeData.inputs ?? []
  const outputs = nodeData.outputs ?? []
  const variables = nodeData.variables ?? []
  const displayMode     = nodeData.displayMode ?? 'value'
  const seriesChartType = nodeData.seriesChartType ?? 'area'

  const hasMeasureInput = useStore(s => {
    const visited = new Set<string>()
    const queue = [id as string]
    while (queue.length) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      for (const edge of s.edges) {
        if (edge.target !== current) continue
        const sourceNode = s.nodes.find(n => n.id === edge.source)
        if (!sourceNode) continue
        if ((sourceNode.data as FeedbackNodeData).variant === 'measure') return true
        queue.push(edge.source)
      }
    }
    return false
  })

  const primaryPortId = isMetric ? METRIC_PORT_ID : (outputs[0]?.id ?? '')
  const primaryValue  = activeEvalMap.get(`${id as string}:${primaryPortId}`)
    ?? (isValueNode ? (simMode && simOverlay.has(`${id as string}:${primaryPortId}`) ? simOverlay.get(`${id as string}:${primaryPortId}`) : outputs[0]?.value) : undefined)
  const primaryUnit   = unitMap.get(`${id as string}:${primaryPortId}`) ?? outputs[0]?.unit

  const [seriesHistory, setSeriesHistory] = useState<number[]>([])

  useEffect(() => {
    if (!hasMeasureInput && variant !== 'measure' && displayMode === 'series') {
      updateNodeData(id as string, { displayMode: undefined } as Partial<FeedbackNodeData>)
    }
  }, [hasMeasureInput, variant, displayMode, id, updateNodeData])

  useEffect(() => {
    if (displayMode !== 'series' || primaryValue === undefined) return
    setSeriesHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === primaryValue) return prev
      return [...prev.slice(-19), primaryValue]
    })
  }, [primaryValue, displayMode])

  const reorderPorts = useCallback((fromId: string, toId: string, type: 'input' | 'output') => {
    const arr = type === 'input' ? [...inputs] : [...outputs]
    const fromIdx = arr.findIndex(p => p.id === fromId)
    const toIdx = arr.findIndex(p => p.id === toId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
    arr.splice(toIdx, 0, arr.splice(fromIdx, 1)[0])
    updateNodeData(id as string, (type === 'input' ? { inputs: arr } : { outputs: arr }) as Partial<FeedbackNodeData>)
  }, [id, inputs, outputs, updateNodeData])

  const { getPortRowDragProps, getDragHandleProps } = useDragDropPort(reorderPorts)

  const { portLabelField } = usePortEditing({
    nodeId: id as string,
    inputs,
    outputs,
    metricFormula: nodeData.metricFormula,
    updateNodeData,
  })

  const actions = useNodeActions({ id: id as string, nodeData })

  const showExpanded = true
  const isSingleOutputRegular = !isValueNode && !isMetric && outputs.length === 1

  const nodeClass = clsx('feedback-node', {
    [`feedback-node--variant-${variant}`]: !!variant,
    'feedback-node--selected':             !!selected,
    'feedback-node--series':               displayMode === 'series',
    'feedback-node--sim-mode':             !!simMode,
  })

  const nodeCtx = {
    nodeId: id as string,
    nodeData,
    variant: (variant ?? 'expression') as import('../../types/graph').NodeVariant,
    isValueNode,
    isMetric,
    isSingleOutputRegular,
    showExpanded,
    displayMode,
    inputs,
    outputs,
    variables,
    seriesHistory,
    seriesChartType,
    primaryUnit,
    primaryValue,
    portLabelField,
    getPortRowDragProps,
    getDragHandleProps,
    updateOutputValue: actions.updateOutputValue,
    setOutputUnit: actions.setOutputUnit,
    setMetricUnit: actions.setMetricUnit,
    hasMeasureInput,
    addQuickInput: actions.addQuickInput,
    addQuickConstant: actions.addQuickConstant,
    addQuickOutput: actions.addQuickOutput,
    onSourceUrlChange: (url: string | undefined) => updateNodeData(id as string, { sourceUrl: url } as Partial<FeedbackNodeData>),
    onMetricFormulaChange: (v: string | undefined) => updateNodeData(id as string, { metricFormula: v } as Partial<FeedbackNodeData>),
    onOutputFormulaChange: (portId: string, formula: string | undefined) => updateNodeData(id as string, { outputs: outputs.map(p => p.id === portId ? { ...p, formula } : p) } as Partial<FeedbackNodeData>),
  }

  return (
    <NodeContext.Provider value={nodeCtx}>
    <div className={nodeClass}>
      <NodeHeader
        nodeData={nodeData}
        isEditingLabel={isEditingLabel}
        labelDraft={labelDraft}
        showExpanded={showExpanded}
        setLabelDraft={setLabelDraft}
        setIsEditingLabel={setIsEditingLabel}
        commitLabel={() => actions.commitLabel(labelDraft, trimmed => { setLabelDraft(trimmed); setIsEditingLabel(false) })}
        saveToLibrary={actions.saveToLibrary}
        deleteNode={actions.deleteNode}
      />

      {simMode && <SimSliders
        nodeId={id as string}
        isValueNode={isValueNode}
        isMetric={isMetric}
        outputs={outputs}
        simOverlay={simOverlay}
        baseEvalMap={evalMap}
        unitMap={unitMap}
        setSimValue={setSimValue}
        removeSimValue={removeSimValue}
      />}

      {isValueNode && <ValueNodeBody />}
      {isMetric && <MetricNodeBody />}
      {!isValueNode && !isMetric && <ExpressionNodeBody />}
    </div>
    </NodeContext.Provider>
  )
}
