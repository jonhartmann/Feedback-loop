import { useState, useCallback, useEffect } from 'react'
import type { Node, NodeProps } from '@xyflow/react'
import { useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData } from '../../types/graph'
import { METRIC_PORT_ID } from '../../types/graph'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import { useSimContext } from '../../context/SimContext'
import { SimSliders } from './SimSliders'
import { useDragDropPort } from './useDragDropPort'
import { usePortEditing } from './usePortEditing'
import { NodeContext } from './NodeContext'
import { useNodeDisplayMode } from './useNodeDisplayMode'
import { NodeSummaryOverlay } from './NodeSummaryOverlay'
import { ValueNodeBody } from './ValueNodeBody'
import { MetricNodeBody } from './MetricNodeBody'
import { ExpressionNodeBody } from './ExpressionNodeBody'
import { NodeHeader } from './NodeHeader'
import { useNodeActions } from './useNodeActions'
import './FeedbackNode.css'

const variantOptions = [
  { value: 'expression', label: 'Expression' },
  { value: 'constant',   label: 'Constant' },
  { value: 'measure',    label: 'Measure' },
  { value: 'metric',     label: 'Metric' },
]

export default function FeedbackNode({ id, data, selected }: NodeProps<Node<FeedbackNodeData>>) {
  const nodeData = data as FeedbackNodeData
  const variant = nodeData.variant
  const isValueNode = variant === 'constant' || variant === 'measure'
  const isMetric = variant === 'metric'

  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(nodeData.label)
  const [showEditor, setShowEditor] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const { updateNodeData } = useReactFlow()
  const evalMap = useEvalMap()
  const unitMap = useUnitMap()
  const { simMode, simOverlay, setSimValue, removeSimValue, simEvalMap } = useSimContext()

  const activeEvalMap = simMode ? simEvalMap : evalMap

  const inputs = nodeData.inputs ?? []
  const outputs = nodeData.outputs ?? []
  const variables = nodeData.variables ?? []
  const displayMode     = nodeData.displayMode ?? 'value'
  const seriesChartType = nodeData.seriesChartType ?? 'line'

  const primaryPortId = isMetric ? METRIC_PORT_ID : (outputs[0]?.id ?? '')
  const primaryValue  = activeEvalMap.get(`${id as string}:${primaryPortId}`)
    ?? (isValueNode ? (simMode && simOverlay.has(`${id as string}:${primaryPortId}`) ? simOverlay.get(`${id as string}:${primaryPortId}`) : outputs[0]?.value) : undefined)
  const primaryUnit   = unitMap.get(`${id as string}:${primaryPortId}`) ?? outputs[0]?.unit

  const [seriesHistory, setSeriesHistory] = useState<number[]>([])

  useEffect(() => {
    if (displayMode !== 'series' || primaryValue === undefined) return
    setSeriesHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === primaryValue) return prev
      return [...prev.slice(-99), primaryValue]
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

  const { editingPortId, portLabelField } = usePortEditing({
    nodeId: id as string,
    inputs,
    outputs,
    metricFormula: nodeData.metricFormula,
    updateNodeData,
  })

  const actions = useNodeActions({ id: id as string, nodeData })

  const isPinned = showEditor || isEditingLabel || editingPortId !== null
  const nodeDisplayMode = useNodeDisplayMode(simMode, isHovered, isFocused, isPinned)
  const showExpanded = nodeDisplayMode === 'expanded'
  const isSingleOutputRegular = !isValueNode && !isMetric && outputs.length === 1

  const nodeClass = [
    'feedback-node',
    variant ? `variant-${variant}` : '',
    selected ? 'selected' : '',
    displayMode === 'series' ? 'is-series' : '',
    simMode ? 'sim-mode' : '',
  ].filter(Boolean).join(' ')

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
    cycleOutputUnit: actions.cycleOutputUnit,
    cycleMetricUnit: actions.cycleMetricUnit,
    addQuickInput: actions.addQuickInput,
    addQuickConstant: actions.addQuickConstant,
    addQuickOutput: actions.addQuickOutput,
    onChartTypeChange: (t: import('./SeriesModePanel').ChartType) => updateNodeData(id as string, { seriesChartType: t } as Partial<FeedbackNodeData>),
    onSourceUrlChange: (url: string | undefined) => updateNodeData(id as string, { sourceUrl: url } as Partial<FeedbackNodeData>),
    onMetricFormulaChange: (v: string | undefined) => updateNodeData(id as string, { metricFormula: v } as Partial<FeedbackNodeData>),
  }

  return (
    <NodeContext.Provider value={nodeCtx}>
    <div
      className={nodeClass}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as HTMLElement)) setIsFocused(false)
      }}
    >
      <NodeHeader
        id={id as string}
        nodeData={nodeData}
        variant={variant}
        isEditingLabel={isEditingLabel}
        labelDraft={labelDraft}
        showExpanded={showExpanded}
        showEditor={showEditor}
        displayMode={displayMode}
        variantOptions={variantOptions}
        setLabelDraft={setLabelDraft}
        setIsEditingLabel={setIsEditingLabel}
        setShowEditor={setShowEditor}
        commitLabel={() => actions.commitLabel(labelDraft, trimmed => { setLabelDraft(trimmed); setIsEditingLabel(false) })}
        changeVariant={actions.changeVariant}
        saveToLibrary={actions.saveToLibrary}
        deleteNode={actions.deleteNode}
      />

      {nodeDisplayMode === 'collapsed' && <NodeSummaryOverlay />}

      {nodeDisplayMode === 'sim' && <SimSliders
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
      {!isValueNode && !isMetric && <ExpressionNodeBody showEditor={showEditor} />}
    </div>
    </NodeContext.Provider>
  )
}
