import { useState, useCallback, useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { Node, NodeProps } from '@xyflow/react'
import { useReactFlow } from '@xyflow/react'
import type { FeedbackNodeData } from '../../types/graph'
import { METRIC_PORT_ID } from '../../types/graph'
import { useEvalMap, useUnitMap, useCanShowSeries, useGetValueHistory } from '../../context/GraphEvalContext'
import { DisplayModeDropdown } from './DisplayModeDropdown'
import type { DisplayModeCombined } from './DisplayModeDropdown'
import { useSimContext } from '../../context/SimContext'
import { SimSliders } from './SimSliders'
import { HighlightDropdown } from './HighlightDropdown'
import { LockIcon } from './SimSliderRow'
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
  const { simMode, simOverlay, setSimValue, removeSimValue, simEvalMap, lockedKeys, toggleLock } = useSimContext()
  const canShowSeries = useCanShowSeries(id as string)

  const activeEvalMap = simMode ? simEvalMap : evalMap

  const inputs = nodeData.inputs ?? []
  const outputs = nodeData.outputs ?? []
  const displayMode     = nodeData.displayMode ?? 'value'
  const seriesChartType = nodeData.seriesChartType ?? 'line'

  const primaryPortId = isMetric ? METRIC_PORT_ID : (outputs[0]?.id ?? '')
  const primaryValue  = activeEvalMap.get(`${id as string}:${primaryPortId}`)
    ?? (variant === 'constant' ? outputs[0]?.value
      : variant === 'measure'  ? inputs[0]?.value
      : undefined)
  const primaryUnit   = unitMap.get(`${id as string}:${primaryPortId}`) ?? outputs[0]?.unit

  const getValueHistory = useGetValueHistory()
  const [seriesHistory, setSeriesHistory] = useState<number[]>([])

  // Seed history from pre-built buffer when transitioning into series mode
  const prevDisplayModeRef = useRef(displayMode)
  useEffect(() => {
    const prev = prevDisplayModeRef.current
    prevDisplayModeRef.current = displayMode
    if (prev !== 'series' && displayMode === 'series') {
      const history = getValueHistory(id as string, primaryPortId)
      if (history.length > 0) setSeriesHistory(history)
    }
  }, [displayMode, id, primaryPortId, getValueHistory])

  // Accumulate values while in series mode (cap at 20)
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
    updateNodeData,
  })

  const actions = useNodeActions({ id: id as string, nodeData })

  const showExpanded = true
  const isSingleOutputRegular = !isValueNode && !isMetric && outputs.length === 1

  function handleDisplayModeChange(mode: DisplayModeCombined) {
    updateNodeData(id as string, {
      displayMode: mode === 'value' ? undefined : 'series',
      seriesChartType: mode === 'value' ? undefined : mode,
    } as Partial<FeedbackNodeData>)
  }

  const displayModeSlot = canShowSeries
    ? <DisplayModeDropdown displayMode={displayMode} seriesChartType={seriesChartType} onChange={handleDisplayModeChange} />
    : null

  // Node-level lock for sim mode header: all output keys locked = node is locked
  const nodeOutputKeys = outputs.map(p => `${id as string}:${p.id}`)
  const isNodeLocked = nodeOutputKeys.length > 0 && nodeOutputKeys.every(k => lockedKeys.has(k))
  function toggleNodeLock() {
    const keysToToggle = isNodeLocked
      ? nodeOutputKeys
      : nodeOutputKeys.filter(k => !lockedKeys.has(k))
    keysToToggle.forEach(k => toggleLock(k))
  }

  const hasSimOverrides = nodeOutputKeys.some(k => simOverlay.has(k))
  function resetNodeSimValues() {
    nodeOutputKeys.forEach(k => removeSimValue(k))
  }

  const simHeaderSlot = (
    <>
      <HighlightDropdown
        inverted={!!nodeData.invertSimHighlight}
        onChange={v => updateNodeData(id as string, { invertSimHighlight: v } as Partial<FeedbackNodeData>)}
      />
      {hasSimOverrides && (
        <button
          className="feedback-node__sim-btn"
          onMouseDown={e => e.stopPropagation()}
          onClick={resetNodeSimValues}
          title="Reset to formula-computed values"
        >↺</button>
      )}
      <button
        className={clsx('feedback-node__sim-btn', { 'feedback-node__sim-btn--locked': isNodeLocked })}
        onMouseDown={e => e.stopPropagation()}
        onClick={toggleNodeLock}
        title={isNodeLocked ? 'Locked — click to unlock' : 'Lock — exclude from back-propagation'}
      >
        <LockIcon locked={isNodeLocked} />
      </button>
    </>
  )

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
    seriesHistory,
    seriesChartType,
    primaryUnit,
    primaryValue,
    portLabelField,
    getPortRowDragProps,
    getDragHandleProps,
    updateOutputValue: actions.updateOutputValue,
    updateInputValue: actions.updateInputValue,
    setOutputUnit: actions.setOutputUnit,
    onMetricPortChange: actions.onMetricPortChange,
    addQuickInput: actions.addQuickInput,
    addQuickOutput: actions.addQuickOutput,
    onSourceUrlChange: actions.onSourceUrlChange,
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
        simMode={!!simMode}
        setLabelDraft={setLabelDraft}
        setIsEditingLabel={setIsEditingLabel}
        commitLabel={() => actions.commitLabel(labelDraft, trimmed => { setLabelDraft(trimmed); setIsEditingLabel(false) })}
        saveToLibrary={actions.saveToLibrary}
        deleteNode={actions.deleteNode}
        displayModeSlot={displayModeSlot}
        simHeaderSlot={simHeaderSlot}
      />

      {simMode && <SimSliders
        nodeId={id as string}
        isValueNode={isValueNode}
        outputs={outputs}
        invertSimHighlight={!!nodeData.invertSimHighlight}
        simOverlay={simOverlay}
        baseEvalMap={evalMap}
        unitMap={unitMap}
        setSimValue={setSimValue}
      />}

      {isValueNode && <ValueNodeBody />}
      {isMetric && <MetricNodeBody />}
      {!isValueNode && !isMetric && <ExpressionNodeBody />}
    </div>
    </NodeContext.Provider>
  )
}
