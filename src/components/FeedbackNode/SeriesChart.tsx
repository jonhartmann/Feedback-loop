import { AreaChart, Area, BarChart, Bar, ResponsiveContainer } from 'recharts'
import type { Unit } from '../../types/graph'
import type { ChartType } from './SeriesModePanel'

interface SeriesChartProps {
  data: number[]
  chartType: ChartType
  unit?: Unit
  height?: number
}

export default function SeriesChart({ data, chartType, unit, height = 72 }: SeriesChartProps) {
  const color = unit === 'money' ? '#4caf50' : unit === 'percent' ? '#4a9fd4' : '#9c27b0'
  const d = data.map((value, i) => ({ i, value }))
  const m = { top: 4, right: 4, left: 4, bottom: 4 }

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={d} margin={m}>
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={d} margin={m}>
        <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.25} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
