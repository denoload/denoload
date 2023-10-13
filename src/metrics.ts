export interface Metrics {
  fetch: number[]
  iterations: number[]
  iterationsDone: number
  iterationsFailed: number
}

export function mergeMetrics (...metrics: Metrics[]): Metrics {
  const result: Metrics = {
    fetch: [],
    iterations: [],
    iterationsDone: 0,
    iterationsFailed: 0
  }

  for (const m of metrics) {
    result.fetch.push(...m.fetch)
    result.iterations.push(...m.iterations)
    result.iterationsDone += m.iterationsDone
    result.iterationsFailed += m.iterationsFailed
  }

  return result
}

export interface PerformanceMetric {
  min: number
  max: number
  avg: number
  total: number
  p99: number
  p95: number
  p90: number
  p50: number
}

export interface PerformanceReport {
  fetch: PerformanceMetric
  iterations: PerformanceMetric
}

export function performanceReport (metrics: Metrics): PerformanceReport {
  return {
    fetch: singleMetricReport(metrics.fetch),
    iterations: singleMetricReport(metrics.iterations)
  }
}

function singleMetricReport (data: number[]): PerformanceMetric {
  const [min, max, avg] = calculateMinMaxAvg(data)
  const [p99, p95, p90, p50] = calculatePercentiles(data, [99, 95, 90, 50])

  return {
    min,
    max,
    avg,
    total: data.length,
    p99,
    p95,
    p90,
    p50
  }
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
  // Sort the data in ascending order
  data.sort((a, b) => a - b)

  const results = []
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
