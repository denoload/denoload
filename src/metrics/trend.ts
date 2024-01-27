import { calculateMinMaxAvg, calculatePercentiles } from './utils'

export interface Trend {
  min: number
  max: number
  avg: number
  percentiles: Record<number, number>
  total: number
}

export function trend (data: number[], percentiles: number[]): Trend {
  const [min, max, avg] = calculateMinMaxAvg(data)
  const p = calculatePercentiles(
    data,
    percentiles.sort((a, b) => a - b)
  )

  return { min, max, avg, percentiles: p, total: data.length }
}
