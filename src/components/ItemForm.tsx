import { useState } from 'react'
import type { LibraryItem, NodeTemplate, NodeVariant, Unit } from '../types/graph'
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
  const [label, setLabel]     = useState(initialValues?.label ?? '')
  const [variant, setVariant] = useState<string>(t?.variant ?? 'constant')
  const [value, setValue]     = useState(t?.value ?? 0)
  const [unit, setUnit]       = useState<Unit>(t?.unit ?? t?.metricUnit ?? 'number')
  const [sourceUrl, setSourceUrl] = useState(t?.sourceUrl ?? '')
  const [formula, setFormula] = useState(t?.metricFormula ?? '')
  const [displayMode, setDisplayMode] = useState<'value' | 'series'>(t?.displayMode ?? 'value')
  const [chartType, setChartType] = useState<'area' | 'bar'>(t?.seriesChartType ?? 'area')

  function handleSave() {
    if (!label.trim()) return
    const template: NodeTemplate = { label: label.trim() }
    template.variant = variant as NodeVariant
    if (variant === 'constant') { template.value = value; if (unit !== 'number') template.unit = unit }
    if (variant === 'measure')  { template.sourceUrl = sourceUrl || undefined; if (unit !== 'number') template.unit = unit }
    if (variant === 'metric')   { template.metricFormula = formula || undefined; if (unit !== 'number') template.metricUnit = unit }
    if (variant !== 'constant' && displayMode === 'series') {
      template.displayMode = 'series'
      template.seriesChartType = chartType
    }
    onSave({ label: label.trim(), template })
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
          <select className="item-form__select" value={chartType} onChange={e => setChartType(e.target.value as 'area' | 'bar')}>
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
