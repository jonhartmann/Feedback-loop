import type { OutputPort, Unit } from '../../types/graph'
import { SimSliderRow } from './SimSliderRow'

interface SimSlidersProps {
  nodeId: string
  isValueNode: boolean
  outputs: OutputPort[]
  simOverlay: Map<string, number>
  baseEvalMap: Map<string, number>
  unitMap: Map<string, Unit>
  setSimValue: (key: string, value: number) => void
  removeSimValue: (key: string) => void
}

export function SimSliders({ nodeId, isValueNode, outputs, simOverlay, baseEvalMap, unitMap, setSimValue, removeSimValue }: SimSlidersProps) {
  type SliderDef = { portId: string; label: string; unit: Unit | undefined; baseVal: number }
  const sliders: SliderDef[] = []

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
      }
    }
  }

  if (sliders.length === 0) return null

  return (
    <div className="sim-panel">
      {sliders.map(({ portId, label, unit, baseVal }) => (
        <SimSliderRow
          key={portId}
          nodeKey={`${nodeId}:${portId}`}
          label={label}
          unit={unit}
          baseVal={baseVal}
          showLabel={sliders.length > 1}
          useBackProp={!isValueNode}
          simOverlay={simOverlay}
          setSimValue={setSimValue}
          removeSimValue={removeSimValue}
        />
      ))}
    </div>
  )
}
