import type { OutputPort, Unit } from '../../types/graph'
import { SimSliderRow } from './SimSliderRow'

interface SimSlidersProps {
  nodeId: string
  isValueNode: boolean
  outputs: OutputPort[]
  invertSimHighlight: boolean
  simOverlay: Map<string, number>
  baseEvalMap: Map<string, number>
  unitMap: Map<string, Unit>
  setSimValue: (key: string, value: number) => void
}

export function SimSliders({ nodeId, isValueNode, outputs, invertSimHighlight, simOverlay, baseEvalMap, unitMap, setSimValue }: SimSlidersProps) {
  type SliderDef = { portId: string; label: string; unit: Unit | undefined; baseVal: number }
  const sliders: SliderDef[] = []
  const errorPorts: { portId: string; label: string }[] = []

  if (isValueNode) {
    for (const port of outputs) {
      const baseVal = baseEvalMap.get(`${nodeId}:${port.id}`) ?? port.value ?? 0
      sliders.push({ portId: port.id, label: port.label, unit: port.unit, baseVal })
    }
  } else {
    for (const port of outputs) {
      const baseVal = baseEvalMap.get(`${nodeId}:${port.id}`)
      if (baseVal !== undefined) {
        sliders.push({ portId: port.id, label: port.label, unit: unitMap.get(`${nodeId}:${port.id}`) ?? port.unit, baseVal })
      } else {
        errorPorts.push({ portId: port.id, label: port.label })
      }
    }
  }

  if (sliders.length === 0 && errorPorts.length === 0) return null

  const showPortLabels = sliders.length + errorPorts.length > 1

  return (
    <div className="sim-panel">
      {sliders.map(({ portId, label, unit, baseVal }) => (
        <SimSliderRow
          key={portId}
          nodeKey={`${nodeId}:${portId}`}
          label={label}
          unit={unit}
          baseVal={baseVal}
          showLabel={showPortLabels}
          useBackProp={!isValueNode}
          invertHighlight={invertSimHighlight}
          simOverlay={simOverlay}
          setSimValue={setSimValue}
        />
      ))}
      {errorPorts.map(({ portId, label }) => (
        <div key={portId} className="sim-panel__error-row">
          {showPortLabels && <span className="sim-panel__label">{label}</span>}
          <span className="sim-panel__error">⚠ Cannot calculate — check formula or connections</span>
        </div>
      ))}
    </div>
  )
}
