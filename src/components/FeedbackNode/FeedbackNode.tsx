import { useState, useCallback, useEffect, useRef } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import type { FeedbackNodeData, NodeVariant, OutputPort, Unit } from '../../types/graph'
import { evalFormula, buildScope, toCamelCase, labelToVarName, formatValue, FORMULA_BUILTINS } from '../../utils/formulaEval'
import { useEvalMap, useUnitMap } from '../../context/GraphEvalContext'
import { useLibraryContext } from '../../context/LibraryContext'
import PortEditor from './PortEditor'
import FormulaInput from './FormulaInput'
import SeriesChart from './SeriesChart'
import './FeedbackNode.css'

const UNITS: Unit[] = ['number', 'money', 'percent']

function unitLabel(unit: Unit | undefined): string {
  switch (unit) {
    case 'money':   return '$'
    case 'percent': return '%'
    default:        return '#'
  }
}

/**
 * Buffered number input — keeps a local draft so `onChange` only fires on
 * blur / Enter, preventing mid-spin re-renders from breaking the browser's
 * native spinner state machine (which caused infinite increment).
 */
function ValueInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  const focusedRef = useRef(false)

  // Sync from external changes (e.g. load-graph) while the field isn't focused
  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value))
  }, [value])

  function commit(raw: string) {
    const n = parseFloat(raw)
    onChange(isFinite(n) ? n : value)
  }

  return (
    <input
      type="number"
      className="port-value-input"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onFocus={() => { focusedRef.current = true }}
      onBlur={e => { focusedRef.current = false; commit(e.target.value) }}
      onKeyDown={e => {
        if (e.key === 'Enter')  { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur() }
        if (e.key === 'Escape') { setDraft(String(value)); (e.target as HTMLInputElement).blur() }
      }}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    />
  )
}


export default function FeedbackNode({ id, data, selected }: NodeProps<Node<FeedbackNodeData>>) {
  const nodeData = data as FeedbackNodeData
  const variant = nodeData.variant
  const isValueNode = variant === 'constant' || variant === 'measure'
  const isMetric = variant === 'metric'

  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(nodeData.label)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPortId, setEditingPortId] = useState<string | null>(null)
  const [portLabelDraft, setPortLabelDraft] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [draggedPort, setDraggedPort] = useState<{ id: string; type: 'input' | 'output' } | null>(null)
  const [dragOverPortId, setDragOverPortId] = useState<string | null>(null)

  const { updateNodeData, deleteElements } = useReactFlow()
  const evalMap = useEvalMap()
  const unitMap = useUnitMap()
  const { addItem } = useLibraryContext()

  // ── Series mode ───────────────────────────────────────────────────────────

  // ── Node label ────────────────────────────────────────────────────────────

  const commitLabel = useCallback(() => {
    const trimmed = labelDraft.trim() || 'Node'
    const oldLabel = nodeData.label
    const update: Partial<FeedbackNodeData> = { label: trimmed }
    if (isValueNode) {
      const oldCamel = toCamelCase(oldLabel)
      const newCamel = toCamelCase(trimmed)
      if (oldCamel !== newCamel) {
        update.outputs = (nodeData.outputs ?? []).map(p =>
          (p.label === 'value' || p.label === oldCamel) ? { ...p, label: newCamel } : p
        )
      }
    }
    updateNodeData(id as string, update)
    setLabelDraft(trimmed)
    setIsEditingLabel(false)
  }, [id, labelDraft, nodeData.label, nodeData.outputs, isValueNode, updateNodeData])

  const deleteNode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id: id as string }] })
  }, [id, deleteElements])

  const saveToLibrary = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      label: nodeData.label,
      category: 'Custom',
      template: {
        label: nodeData.label,
        variant: nodeData.variant,
        value: nodeData.outputs[0]?.value,
        unit: nodeData.outputs[0]?.unit ?? nodeData.metricUnit,
        sourceUrl: nodeData.sourceUrl,
        inputs: nodeData.inputs,
        outputs: nodeData.outputs,
        variables: nodeData.variables,
        metricFormula: nodeData.metricFormula,
        metricUnit: nodeData.metricUnit,
        description: nodeData.description,
      },
    })
  }, [addItem, nodeData])

  // ── Variant change ────────────────────────────────────────────────────────

  const inputs = nodeData.inputs ?? []
  const outputs = nodeData.outputs ?? []
  const variables = nodeData.variables ?? []

  const displayMode     = nodeData.displayMode ?? 'value'
  const seriesChartType = nodeData.seriesChartType ?? 'line'

  const primaryPortId = isMetric ? '__metric' : (outputs[0]?.id ?? '')
  const primaryValue  = evalMap.get(`${id as string}:${primaryPortId}`)
    ?? (isValueNode ? outputs[0]?.value : undefined)
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

  const changeVariant = useCallback((toVariant: NodeVariant | undefined) => {
    if (toVariant === variant) return
    let update: Partial<FeedbackNodeData>
    if (toVariant === 'constant' || toVariant === 'measure') {
      const newOutputs: OutputPort[] = (variant === 'metric' || outputs.length === 0)
        ? [{ id: crypto.randomUUID(), label: toCamelCase(nodeData.label) || 'value', value: 0 }]
        : outputs.map(p => ({ ...p, formula: undefined, value: p.value ?? 0 }))
      update = { variant: toVariant, inputs: [], variables: [], metricFormula: undefined, outputs: newOutputs }
    } else if (toVariant === 'metric') {
      update = {
        variant: toVariant,
        outputs: [],
        inputs: (variant === 'constant' || variant === 'measure') ? [] : inputs,
        metricFormula: nodeData.metricFormula ?? outputs[0]?.formula,
      }
    } else {
      if (variant === 'constant' || variant === 'measure') {
        update = { variant: undefined, inputs: [], outputs: outputs.map(p => ({ ...p, value: undefined })) }
      } else {
        update = { variant: undefined, outputs: [], metricFormula: undefined }
      }
    }
    updateNodeData(id as string, update as Partial<FeedbackNodeData>)
  }, [id, variant, nodeData.label, nodeData.metricFormula, inputs, outputs, updateNodeData])

  // ── Port label inline editing ─────────────────────────────────────────────

  const startPortEdit = useCallback((portId: string, currentLabel: string) => {
    setPortLabelDraft(currentLabel)
    setEditingPortId(portId)
  }, [])

  const cancelPortEdit = useCallback(() => setEditingPortId(null), [])

  const commitPortLabel = useCallback((portId: string, portType: 'input' | 'output') => {
    const trimmed = portLabelDraft.trim()
    if (trimmed) {
      if (portType === 'input') {
        const oldPort = inputs.find(p => p.id === portId)
        const oldVar = labelToVarName(oldPort?.label ?? '')
        const newVar = labelToVarName(trimmed)
        const updatedInputs = inputs.map(p => p.id === portId ? { ...p, label: trimmed } : p)
        const update: Partial<FeedbackNodeData> = { inputs: updatedInputs }
        if (oldVar && oldVar !== newVar) {
          const re = new RegExp(`\\b${oldVar}\\b`, 'g')
          update.outputs = outputs.map(p =>
            p.formula ? { ...p, formula: p.formula.replace(re, newVar) } : p
          )
          if (nodeData.metricFormula) {
            update.metricFormula = nodeData.metricFormula.replace(re, newVar)
          }
        }
        updateNodeData(id as string, update)
      } else {
        updateNodeData(id as string, {
          outputs: outputs.map(p => p.id === portId ? { ...p, label: trimmed } : p),
        } as Partial<FeedbackNodeData>)
      }
    }
    setEditingPortId(null)
  }, [id, portLabelDraft, inputs, outputs, nodeData.metricFormula, updateNodeData])

  // ── Value editing ─────────────────────────────────────────────────────────

  const updateOutputValue = useCallback((portId: string, rawVal: number) => {
    const value = isFinite(rawVal) ? rawVal : 0
    updateNodeData(id as string, {
      outputs: outputs.map(p => p.id === portId ? { ...p, value } : p),
    } as Partial<FeedbackNodeData>)
  }, [id, outputs, updateNodeData])

  // ── Unit cycling ──────────────────────────────────────────────────────────

  const cycleOutputUnit = useCallback((portId: string) => {
    const port = outputs.find(p => p.id === portId)
    const idx = port?.unit ? UNITS.indexOf(port.unit) : 0
    const next = UNITS[(idx + 1) % UNITS.length]
    updateNodeData(id as string, {
      outputs: outputs.map(p => p.id === portId ? { ...p, unit: next === 'number' ? undefined : next } : p),
    } as Partial<FeedbackNodeData>)
  }, [id, outputs, updateNodeData])

  const cycleMetricUnit = useCallback(() => {
    const idx = nodeData.metricUnit ? UNITS.indexOf(nodeData.metricUnit) : 0
    const next = UNITS[(idx + 1) % UNITS.length]
    updateNodeData(id as string, {
      metricUnit: next === 'number' ? undefined : next,
    } as Partial<FeedbackNodeData>)
  }, [id, nodeData.metricUnit, updateNodeData])

  // ── Quick-add ─────────────────────────────────────────────────────────────

  const addQuickInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id as string, {
      inputs: [...inputs, { id: crypto.randomUUID(), label: `in${inputs.length + 1}` }],
    } as Partial<FeedbackNodeData>)
  }, [id, inputs, updateNodeData])

  const addQuickConstant = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id as string, {
      variables: [...variables, { name: `k${variables.length + 1}`, value: 0 }],
    } as Partial<FeedbackNodeData>)
  }, [id, variables, updateNodeData])

  const addQuickOutput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const baseName = toCamelCase(nodeData.label) || 'output'
    const taken = new Set(outputs.map(p => p.label))
    let label = baseName
    if (taken.has(label)) {
      let n = 2
      while (taken.has(`${baseName}${n}`)) n++
      label = `${baseName}${n}`
    }
    const newPort: OutputPort = isValueNode
      ? { id: crypto.randomUUID(), label, value: 0 }
      : { id: crypto.randomUUID(), label }
    updateNodeData(id as string, {
      outputs: [...outputs, newPort],
    } as Partial<FeedbackNodeData>)
  }, [id, outputs, isValueNode, nodeData.label, updateNodeData])

  // ── Shared: inline port label field ──────────────────────────────────────

  const portLabelField = (portId: string, portType: 'input' | 'output', currentLabel: string) =>
    editingPortId === portId ? (
      <input
        className="port-label-input"
        value={portLabelDraft}
        autoFocus
        onChange={e => setPortLabelDraft(e.target.value)}
        onBlur={() => commitPortLabel(portId, portType)}
        onKeyDown={e => {
          if (e.key === 'Enter') commitPortLabel(portId, portType)
          if (e.key === 'Escape') cancelPortEdit()
        }}
        onMouseDown={e => e.stopPropagation()}
      />
    ) : (
      <span
        className="port-label"
        title="Double-click to rename"
        onDoubleClick={() => startPortEdit(portId, currentLabel)}
      >
        {currentLabel}
      </span>
    )

  const localScope = buildScope(variables, new Map())

  // ── Expand / collapse ─────────────────────────────────────────────────────

  const isPinned = showEditor || isEditingLabel || editingPortId !== null
  const showExpanded = isHovered || isPinned || isFocused
  const isSingleOutputRegular = !isValueNode && !isMetric && outputs.length === 1

  const nodeClass = [
    'feedback-node',
    variant ? `variant-${variant}` : '',
    selected ? 'selected' : '',
    displayMode === 'series' ? 'is-series' : '',
  ].filter(Boolean).join(' ')

  const variantOptions = [
    { value: '',         label: 'Expression' },
    { value: 'constant', label: 'Constant' },
    { value: 'measure',  label: 'Measure' },
    { value: 'metric',   label: 'Metric' },
  ]

  // ── Summary overlay content ───────────────────────────────────────────────

  const summaryOverlay = !showExpanded && (
    <div className={`node-summary-overlay${displayMode === 'series' ? ' is-series-collapsed' : ''}`}>
      {displayMode === 'series' && (
        <div style={{ position: 'relative', width: '100%' }}>
          {seriesHistory.length >= 2
            ? <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} height={66} />
            : <div style={{ height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#bbb' }}>—</div>
          }
          {primaryValue !== undefined && (
            <span className={`series-collapsed-value${primaryUnit === 'money' ? ' is-money' : primaryUnit === 'percent' ? ' is-percent' : ''}`}>
              {formatValue(primaryValue, primaryUnit)}
            </span>
          )}
        </div>
      )}
      {displayMode !== 'series' && (<>
        {isValueNode && (
          outputs.length === 0
            ? <span className="summary-value is-empty">—</span>
            : outputs.map(port => (
                <div key={port.id} className="summary-value-block">
                  {outputs.length > 1 && <span className="summary-value-label">{port.label}</span>}
                  <span className={`summary-value${port.unit === 'money' ? ' is-money' : port.unit === 'percent' ? ' is-percent' : ''}`}>
                    {port.value !== undefined ? formatValue(port.value, port.unit) : '—'}
                  </span>
                </div>
              ))
        )}

        {isMetric && (() => {
          const metricKey = `${id as string}:__metric`
          const metricVal = evalMap.get(metricKey)
          const metricUnit = unitMap.get(metricKey) ?? nodeData.metricUnit
          return (
            <span className={`summary-value${metricUnit === 'money' ? ' is-money' : metricUnit === 'percent' ? ' is-percent' : ''}`}>
              {metricVal !== undefined ? formatValue(metricVal, metricUnit) : nodeData.metricFormula ? '…' : '—'}
            </span>
          )
        })()}

        {!isValueNode && !isMetric && (
          isSingleOutputRegular ? (
            (() => {
              const port = outputs[0]
              if (!port) return <span className="summary-value is-empty">no outputs</span>
              const val = evalMap.get(`${id as string}:${port.id}`)
              const unit = unitMap.get(`${id as string}:${port.id}`) ?? port.unit
              return (
                <span className={`summary-value${unit === 'money' ? ' is-money' : unit === 'percent' ? ' is-percent' : ''}`}>
                  {val !== undefined ? formatValue(val, unit) : '—'}
                </span>
              )
            })()
          ) : outputs.length === 0 ? (
            <span className="summary-value is-empty">no outputs</span>
          ) : (
            outputs.map(port => {
              const val = evalMap.get(`${id as string}:${port.id}`)
              const unit = unitMap.get(`${id as string}:${port.id}`) ?? port.unit
              return (
                <div key={port.id} className="summary-output-row">
                  <span className="summary-output-label">{port.label}</span>
                  <span className={`summary-output-value${unit === 'money' ? ' is-money' : unit === 'percent' ? ' is-percent' : ''}`}>
                    {val !== undefined ? formatValue(val, unit) : '—'}
                  </span>
                </div>
              )
            })
          )
        )}
      </>)}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={nodeClass}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as HTMLElement)) setIsFocused(false)
      }}
    >

      {/* ── Header ── */}
      <div className="node-header">
        {isEditingLabel ? (
          <input
            className="node-label-input"
            value={labelDraft}
            autoFocus
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => {
              if (e.key === 'Enter') commitLabel()
              if (e.key === 'Escape') { setLabelDraft(nodeData.label); setIsEditingLabel(false) }
            }}
            onMouseDown={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="node-label"
            title="Double-click to edit"
            onDoubleClick={() => { setLabelDraft(nodeData.label); setIsEditingLabel(true) }}
          >
            {nodeData.label}
          </span>
        )}

        {showExpanded && (
          <select
            className={`variant-select${variant ? ` variant-${variant}` : ''}`}
            value={variant ?? ''}
            onMouseDown={e => e.stopPropagation()}
            onChange={e => changeVariant((e.target.value as NodeVariant) || undefined)}
          >
            {variantOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {showExpanded && variant !== 'constant' && (
          <button
            className="display-mode-btn"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              updateNodeData(id as string, {
                displayMode: displayMode === 'series' ? undefined : 'series',
              } as Partial<FeedbackNodeData>)
            }}
            title={displayMode === 'series' ? 'Switch to current value' : 'Switch to series view'}
          >
            {displayMode === 'series' ? '⊟' : '∿'}
          </button>
        )}

        {showExpanded && !isValueNode && !isMetric && (
          <button
            className="edit-ports-btn"
            onMouseDown={e => e.stopPropagation()}
            onClick={() => setShowEditor(v => !v)}
            title="Edit node details"
          >
            {showEditor ? 'Done' : 'Edit'}
          </button>
        )}

        {showExpanded && (
          <button
            className="save-library-btn"
            onMouseDown={e => e.stopPropagation()}
            onClick={saveToLibrary}
            title="Save to Library"
          >
            ☆
          </button>
        )}

        {showExpanded && (
          <button
            className="delete-node-btn"
            onMouseDown={e => e.stopPropagation()}
            onClick={deleteNode}
            title="Delete node"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Collapsed summary overlay (sits above body, behind handles) ── */}
      {summaryOverlay}

      {/* ── Body: Constant / Measure ──────────────────────────────────────────
          Always rendered so handles stay in the DOM at their natural positions.
          Text content is hidden when collapsed; handles are raised above the
          summary overlay via z-index so they remain interactive.
      ── */}
      {isValueNode && (
        <div className="node-body value-node-body">
          {showExpanded && displayMode === 'series' && (
            <div className="chart-type-row">
              {(['line', 'area', 'bar'] as const).map(t => (
                <button key={t} className={`chart-type-btn${seriesChartType === t ? ' active' : ''}`}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); updateNodeData(id as string, { seriesChartType: t } as Partial<FeedbackNodeData>) }}
                  title={t}
                >{t === 'line' ? '∿' : t === 'area' ? '◿' : '▮▮'}</button>
              ))}
            </div>
          )}
          {displayMode === 'series' && showExpanded && seriesHistory.length > 0 && (
            <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} />
          )}
          {displayMode === 'series' && showExpanded && seriesHistory.length === 0 && (
            <div className="series-empty">Waiting for data…</div>
          )}
          {outputs.map(port => {
            const resolvedUnit = unitMap.get(`${id as string}:${port.id}`) ?? port.unit
            return (
              <div
                key={port.id}
                className={`port-row${dragOverPortId === port.id && draggedPort?.type === 'output' ? ' drag-over' : ''}`}
                onDragOver={e => { if (draggedPort?.type === 'output') { e.preventDefault(); setDragOverPortId(port.id) } }}
                onDragLeave={() => setDragOverPortId(null)}
                onDrop={() => { if (draggedPort?.type === 'output') { reorderPorts(draggedPort.id, port.id, 'output'); setDraggedPort(null); setDragOverPortId(null) } }}
              >
                <Handle id={port.id} type="source" position={Position.Right} title={port.label} />
                {showExpanded && <span className="port-drag-handle" draggable onDragStart={e => { e.stopPropagation(); setDraggedPort({ id: port.id, type: 'output' }) }} onDragEnd={() => { setDraggedPort(null); setDragOverPortId(null) }}>⠿</span>}
                {showExpanded && portLabelField(port.id, 'output', port.label)}
                {showExpanded && <span className="port-value-eq">=</span>}
                {showExpanded && (
                  <ValueInput
                    value={port.value ?? 0}
                    onChange={v => updateOutputValue(port.id, v)}
                  />
                )}
                {showExpanded && (
                  <button
                    className={`unit-cycle-btn${port.unit === 'money' ? ' is-money' : port.unit === 'percent' ? ' is-percent' : ''}`}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); cycleOutputUnit(port.id) }}
                    title={`Unit: ${resolvedUnit ?? 'number'} — click to cycle`}
                  >
                    {unitLabel(port.unit)}
                  </button>
                )}
              </div>
            )
          })}
          {showExpanded && (
            <div className="quick-add-row" style={{ justifyContent: 'flex-end' }}>
              <button
                className="port-quick-add-btn"
                onMouseDown={e => e.stopPropagation()}
                onClick={addQuickOutput}
                title="Add output"
              >+ out</button>
            </div>
          )}
          {showExpanded && variant === 'measure' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px 4px' }}>
              <span style={{ fontSize: 10, color: '#888', flexShrink: 0 }}>URL</span>
              <input
                value={nodeData.sourceUrl ?? ''}
                onChange={e => updateNodeData(id as string, { sourceUrl: e.target.value || undefined } as Partial<FeedbackNodeData>)}
                placeholder="/api/range?min=0&max=100"
                style={{ flex: 1, fontSize: 10, padding: '1px 4px', border: '1px solid #b0cce8', borderRadius: 3, fontFamily: 'monospace', minWidth: 0 }}
                onMouseDown={e => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Body: Metric ── */}
      {isMetric && (() => {
        const metricKey = `${id as string}:__metric`
        const metricGraphValue = evalMap.get(metricKey)
        const metricResolvedUnit = unitMap.get(metricKey) ?? nodeData.metricUnit
        const metricLocalResult = nodeData.metricFormula
          ? evalFormula(nodeData.metricFormula, localScope)
          : null

        let metricDisplay: { text: string; isError: boolean } | null = null
        if (nodeData.metricFormula) {
          if (metricGraphValue !== undefined) {
            metricDisplay = { text: `= ${formatValue(metricGraphValue, metricResolvedUnit)}`, isError: false }
          } else if (metricLocalResult?.type === 'error') {
            metricDisplay = { text: '⚠ ' + metricLocalResult.message, isError: true }
          } else {
            metricDisplay = { text: `= ${nodeData.metricFormula}`, isError: false }
          }
        }

        return (
          <div className="node-body metric-body">
            {showExpanded && displayMode === 'series' && (
              <div className="chart-type-row">
                {(['line', 'area', 'bar'] as const).map(t => (
                  <button key={t} className={`chart-type-btn${seriesChartType === t ? ' active' : ''}`}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); updateNodeData(id as string, { seriesChartType: t } as Partial<FeedbackNodeData>) }}
                    title={t}
                  >{t === 'line' ? '∿' : t === 'area' ? '◿' : '▮▮'}</button>
                ))}
              </div>
            )}
            {displayMode === 'series' && showExpanded && seriesHistory.length > 0 && (
              <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} />
            )}
            {displayMode === 'series' && showExpanded && seriesHistory.length === 0 && (
              <div className="series-empty">Waiting for data…</div>
            )}
            <div className="ports-column inputs">
              {inputs.map(port => (
                <div
                  key={port.id}
                  className={`port-row${dragOverPortId === port.id && draggedPort?.type === 'input' ? ' drag-over' : ''}`}
                  onDragOver={e => { if (draggedPort?.type === 'input') { e.preventDefault(); setDragOverPortId(port.id) } }}
                  onDragLeave={() => setDragOverPortId(null)}
                  onDrop={() => { if (draggedPort?.type === 'input') { reorderPorts(draggedPort.id, port.id, 'input'); setDraggedPort(null); setDragOverPortId(null) } }}
                >
                  <Handle id={port.id} type="target" position={Position.Left} title={port.label} />
                  {showExpanded && <span className="port-drag-handle" draggable onDragStart={e => { e.stopPropagation(); setDraggedPort({ id: port.id, type: 'input' }) }} onDragEnd={() => { setDraggedPort(null); setDragOverPortId(null) }}>⠿</span>}
                  {showExpanded && portLabelField(port.id, 'input', port.label)}
                </div>
              ))}
              {showExpanded && variables.map((v, i) => (
                <div key={i} className="port-row">
                  <span className="port-label is-constant">{v.name}</span>
                  <span className="port-constant-badge">= {v.value}</span>
                </div>
              ))}
              {showExpanded && inputs.length === 0 && variables.length === 0 && (
                <span style={{ fontSize: 11, color: '#aaa' }}>no inputs</span>
              )}
              {showExpanded && (
                <div className="quick-add-row">
                  <button className="port-quick-add-btn" onMouseDown={e => e.stopPropagation()} onClick={addQuickInput} title="Add input">+ in</button>
                  <button className="port-quick-add-btn is-constant" onMouseDown={e => e.stopPropagation()} onClick={addQuickConstant} title="Add constant">+ const</button>
                </div>
              )}
            </div>

            {showExpanded && (
              <div className="metric-formula-panel">
                <FormulaInput
                  className="metric-formula-input"
                  placeholder="formula…"
                  value={nodeData.metricFormula ?? ''}
                  onChange={v => updateNodeData(id as string, { metricFormula: v || undefined } as Partial<FeedbackNodeData>)}
                  variables={[
                    ...inputs.map(i => labelToVarName(i.label)),
                    ...variables.filter(v => /^[a-zA-Z_]\w*$/.test(v.name)).map(v => v.name),
                  ].filter(Boolean)}
                  builtins={FORMULA_BUILTINS}
                  onMouseDown={e => e.stopPropagation()}
                />
                {metricDisplay && (
                  <span className={`metric-result${metricDisplay.isError ? ' is-error' : ''}`}>
                    {metricDisplay.text}
                  </span>
                )}
                <button
                  className={`unit-cycle-btn${nodeData.metricUnit === 'money' ? ' is-money' : nodeData.metricUnit === 'percent' ? ' is-percent' : ''}`}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); cycleMetricUnit() }}
                  title={`Unit: ${metricResolvedUnit ?? 'number'} — click to cycle`}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {unitLabel(nodeData.metricUnit)}
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Body: Regular node ── */}
      {!isValueNode && !isMetric && (
        <div className="node-body">
          {showExpanded && displayMode === 'series' && (
            <div className="chart-type-row" style={{ gridColumn: '1 / -1' }}>
              {(['line', 'area', 'bar'] as const).map(t => (
                <button key={t} className={`chart-type-btn${seriesChartType === t ? ' active' : ''}`}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); updateNodeData(id as string, { seriesChartType: t } as Partial<FeedbackNodeData>) }}
                  title={t}
                >{t === 'line' ? '∿' : t === 'area' ? '◿' : '▮▮'}</button>
              ))}
            </div>
          )}
          {displayMode === 'series' && showExpanded && seriesHistory.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <SeriesChart data={seriesHistory} chartType={seriesChartType} unit={primaryUnit} />
            </div>
          )}
          {displayMode === 'series' && showExpanded && seriesHistory.length === 0 && (
            <div className="series-empty" style={{ gridColumn: '1 / -1' }}>Waiting for data…</div>
          )}
          <div className="ports-column inputs">
            {inputs.map(port => (
              <div
                key={port.id}
                className={`port-row${dragOverPortId === port.id && draggedPort?.type === 'input' ? ' drag-over' : ''}`}
                onDragOver={e => { if (draggedPort?.type === 'input') { e.preventDefault(); setDragOverPortId(port.id) } }}
                onDragLeave={() => setDragOverPortId(null)}
                onDrop={() => { if (draggedPort?.type === 'input') { reorderPorts(draggedPort.id, port.id, 'input'); setDraggedPort(null); setDragOverPortId(null) } }}
              >
                <Handle id={port.id} type="target" position={Position.Left} title={port.label} />
                {showExpanded && <span className="port-drag-handle" draggable onDragStart={e => { e.stopPropagation(); setDraggedPort({ id: port.id, type: 'input' }) }} onDragEnd={() => { setDraggedPort(null); setDragOverPortId(null) }}>⠿</span>}
                {showExpanded && portLabelField(port.id, 'input', port.label)}
              </div>
            ))}
            {showExpanded && variables.map((v, i) => (
              <div key={i} className="port-row">
                <span className="port-label is-constant">{v.name}</span>
                <span className="port-constant-badge">= {v.value}</span>
              </div>
            ))}
            {showExpanded && inputs.length === 0 && variables.length === 0 && (
              <span style={{ fontSize: 11, color: '#aaa' }}>no inputs</span>
            )}
            {showExpanded && (
              <div className="quick-add-row">
                <button className="port-quick-add-btn" onMouseDown={e => e.stopPropagation()} onClick={addQuickInput} title="Add input">+ in</button>
                <button className="port-quick-add-btn is-constant" onMouseDown={e => e.stopPropagation()} onClick={addQuickConstant} title="Add constant">+ const</button>
              </div>
            )}
          </div>

          <div className="ports-column outputs">
            {outputs.map(port => {
              const graphValue = evalMap.get(`${id as string}:${port.id}`)
              const resolvedUnit = unitMap.get(`${id as string}:${port.id}`) ?? port.unit

              let computedValue: number | undefined
              let formulaError: string | undefined
              if (port.formula) {
                if (graphValue !== undefined) {
                  computedValue = graphValue
                } else {
                  const local = evalFormula(port.formula, localScope)
                  if (local.type === 'error') formulaError = local.message
                }
              }

              return (
                <div
                  key={port.id}
                  className={`port-row${dragOverPortId === port.id && draggedPort?.type === 'output' ? ' drag-over' : ''}`}
                  onDragOver={e => { if (draggedPort?.type === 'output') { e.preventDefault(); setDragOverPortId(port.id) } }}
                  onDragLeave={() => setDragOverPortId(null)}
                  onDrop={() => { if (draggedPort?.type === 'output') { reorderPorts(draggedPort.id, port.id, 'output'); setDraggedPort(null); setDragOverPortId(null) } }}
                >
                  <Handle id={port.id} type="source" position={Position.Right} title={port.label} />
                  {showExpanded && <span className="port-drag-handle" draggable onDragStart={e => { e.stopPropagation(); setDraggedPort({ id: port.id, type: 'output' }) }} onDragEnd={() => { setDraggedPort(null); setDragOverPortId(null) }}>⠿</span>}
                  {showExpanded && portLabelField(port.id, 'output', port.label)}
                  {showExpanded && formulaError && (
                    <span className="port-formula-display is-error" title={formulaError}>⚠</span>
                  )}
                  {showExpanded && (
                    <button
                      className={`unit-cycle-btn${port.unit === 'money' ? ' is-money' : port.unit === 'percent' ? ' is-percent' : ''}`}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); cycleOutputUnit(port.id) }}
                      title={`Unit: ${resolvedUnit ?? 'number'} — click to cycle`}
                    >
                      {unitLabel(port.unit)}
                    </button>
                  )}
                  {showExpanded && computedValue !== undefined && (
                    <div className={`port-value-float${resolvedUnit === 'money' ? ' is-money' : resolvedUnit === 'percent' ? ' is-percent' : ''}`}>
                      {formatValue(computedValue, resolvedUnit)}
                    </div>
                  )}
                </div>
              )
            })}
            {showExpanded && outputs.length === 0 && <span style={{ fontSize: 11, color: '#aaa' }}>no outputs</span>}
            {showExpanded && (
              <div className="quick-add-row" style={{ justifyContent: 'flex-end' }}>
                <button className="port-quick-add-btn" onMouseDown={e => e.stopPropagation()} onClick={addQuickOutput} title="Add output">+ out</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description / editor — expanded only */}
      {showExpanded && !isValueNode && !isMetric && !showEditor && nodeData.description && (
        <div className="node-meta">
          <p className="node-description">{nodeData.description}</p>
        </div>
      )}

      {showExpanded && !isValueNode && !isMetric && showEditor && (
        <div className="port-editor-wrapper">
          <PortEditor
            nodeId={id as string}
            inputs={inputs}
            outputs={outputs}
            description={nodeData.description}
            variables={nodeData.variables}
          />
        </div>
      )}
    </div>
  )
}
