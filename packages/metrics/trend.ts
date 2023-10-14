export interface Trend {
  min: number
  max: number
  avg: number
  percentiles: number[]
}

export function trend (data: number[], percentiles: number[]): Trend {
  const [min, max, avg] = calculateMinMaxAvg(data)
  const p = calculatePercentiles(data, percentiles.sort((a, b) => b - a))

  return { min, max, avg, percentiles: p }
}

function calculateMinMaxAvg (data: number[]): [number, number, number] {
  if (data.length === 0) {
    return [0, 0, 0]
  }

  let min = data[0]
  let max = data[0]
  let sum = data[0]

  for (let i = 1; i < data.length; i++) {
    const value = data[i]
    if (value < min) {
      min = value
    }
    if (value > max) {
      max = value
    }
    sum += value
  }

  const avg = sum / data.length

  return [min, max, avg]
}

function calculatePercentiles (data: number[], percentiles: number[]): number[] {
  if (data.length === 0) {
    return percentiles.map(() => 0)
  }

  // Sort the data in ascending order
  data.sort((a, b) => a - b)

  const results: number[] = []
  for (const percentile of percentiles) {
    const index = (percentile / 100) * (data.length - 1)
    if (index % 1 === 0) {
      // If the index is an integer, take the exact value
      results.push(data[index])
    } else {
      // If the index is not an integer, interpolate between adjacent values
      const lower = Math.floor(index)
      const upper = lower + 1
      const fraction = index - lower
      const interpolatedValue = data[lower] + fraction * (data[upper] - data[lower])
      results.push(interpolatedValue)
    }
  }

  return results
}
