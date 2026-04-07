import { useState } from 'react'
import type { LibraryItem, NodeTemplate, NodeVariant, Unit, OutputPort, InputPort } from '../types/graph'
import { METRIC_PORT_ID } from '../types/graph'
import { toCamelCase, labelToVarName } from '../utils/formulaEval'
import './ItemForm.css'

function UnitSelect({ value, onChange }: { value: Unit; onChange: (u: Unit) => void }) {
  return (
    <select className="item-form__select" value={value} onChange={e => onChange(e.target.value as Unit)}>
      <option value="number">Number</option>
      <option value="money">Money ($)</option>
      <option value="percent">Percent (%)</option>
    </select>
  )
}

export function ItemForm({
  initialValues,
  onSave,
  onCancel,
}: {
  initialValues?: LibraryItem
  onSave: (item: Omit<LibraryItem, 'id'>) => void
  onCancel: () => void
}) {
  const t = initialValues?.template

  // Derive initial state from existing template ports when available
  const existingMetricPort = t?.outputs?.find(p => p.id === METRIC_PORT_ID)
  const existingSourceInput = t?.inputs?.[0]

  const [label, setLabel]     = useState(initialValues?.label ?? '')
  const [variant, setVariant] = useState<string>(t?.variant ?? 'constant')
  const [value, setValue]     = useState(t?.value ?? 0)
  const [unit, setUnit]       = useState<Unit>(t?.outputs?.[0]?.unit ?? existingMetricPort?.unit ?? 'number')
  const [sourceUrl, setSourceUrl] = useState(existingSourceInput?.sourceUrl ?? '')
  const [formula, setFormula] = useState(existingMetricPort?.formula ?? '')
  const [displayMode, setDisplayMode] = useState<'value' | 'series'>(t?.displayMode ?? 'value')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>(t?.seriesChartType ?? 'line')

  function handleSave() {
    if (!label.trim()) return
    const trimmed = label.trim()
    const template: NodeTemplate = { label: trimmed }
    template.variant = variant as NodeVariant

    if (variant === 'constant') {
      template.value = value
      const outputs: OutputPort[] = [{ id: crypto.randomUUID(), label: toCamelCase(trimmed) || 'value', value }]
      if (unit !== 'number') { outputs[0].unit = unit }
      template.outputs = outputs
    }

    if (variant === 'measure') {
      const portLabel = toCamelCase(trimmed) || 'value'
      const sourceInput: InputPort = { id: crypto.randomUUID(), label: portLabel }
      if (sourceUrl) sourceInput.sourceUrl = sourceUrl
      template.inputs = [sourceInput]
      template.outputs = [{ id: crypto.randomUUID(), label: portLabel, formula: labelToVarName(portLabel) }]
      if (unit !== 'number') template.outputs[0].unit = unit
    }

    if (variant === 'metric') {
      const metricOutput: OutputPort = { id: METRIC_PORT_ID, label: 'value' }
      if (formula) metricOutput.formula = formula
      if (unit !== 'number') metricOutput.unit = unit
      template.outputs = [metricOutput]
    }

    if (variant !== 'constant' && displayMode === 'series') {
      template.displayMode = 'series'
      template.seriesChartType = chartType
    }

    onSave({ label: trimmed, template })
  }

  return (
    <div className="item-form">
      <input className="item-form__input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" autoFocus />

      <select className="item-form__select" value={variant} onChange={e => setVariant(e.target.value)}>
        <option value="constant">Constant</option>
        <option value="measure">Measure</option>
        <option value="metric">Metric</option>
        <option value="expression">Expression</option>
      </select>

      {variant === 'constant' && <>
        <input className="item-form__input" type="number" value={value} onChange={e => setValue(parseFloat(e.target.value) || 0)} placeholder="Value" />
        <UnitSelect value={unit} onChange={setUnit} />
      </>}

      {variant === 'measure' && <>
        <input className="item-form__input" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Source URL (optional)" />
        <UnitSelect value={unit} onChange={setUnit} />
      </>}

      {variant === 'metric' && <>
        <input className="item-form__input" value={formula} onChange={e => setFormula(e.target.value)} placeholder="Formula (e.g. a * b)" />
        <UnitSelect value={unit} onChange={setUnit} />
      </>}

      {variant !== 'constant' && <>
        <select className="item-form__select" value={displayMode} onChange={e => setDisplayMode(e.target.value as 'value' | 'series')}>
          <option value="value">Current Value</option>
          <option value="series">Series</option>
        </select>
        {displayMode === 'series' && (
          <select className="item-form__select" value={chartType} onChange={e => setChartType(e.target.value as 'line' | 'area' | 'bar')}>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        )}
      </>}

      <div className="item-form__actions">
        <button className="item-form__btn item-form__btn--primary" onClick={handleSave}>Save</button>
        <button className="item-form__btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
