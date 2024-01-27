export function calculateMinMaxAvg (data: number[]): [number, number, number] {
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

export function calculatePercentiles (
  data: number[],
  percentiles: number[]
): Record<number, number> {
  if (data.length === 0) {
    return percentiles.map(() => 0)
  }

  // Sort the data in ascending order
  data.sort((a, b) => a - b)

  const results: Record<number, number> = {}
  for (const percentile of percentiles) {
    const index = (percentile / 100) * (data.length - 1)
    if (index % 1 === 0) {
      // If the index is an integer, take the exact value
      results[percentile] = data[index]
    } else {
      // If the index is not an integer, interpolate between adjacent values
      const lower = Math.floor(index)
      const upper = lower + 1
      const fraction = index - lower
      const interpolatedValue =
        data[lower] + fraction * (data[upper] - data[lower])
      results[percentile] = interpolatedValue
    }
  }

  return results
}
