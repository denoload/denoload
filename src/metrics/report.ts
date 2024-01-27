import { type RegistryObj } from './registry.ts'
import { type Trend, trend as reportTrend } from './trend.ts'

export interface Report {
  trends: Record<string, Record<string, Trend>>
  counters: Record<string, Record<string, number>>
}

export function report (registry: RegistryObj, percentiles: number[]): Report {
  const result: Report = {
    trends: {},
    counters: registry.counters
  }

  for (const trendName in registry.trends) {
    const trend = registry.trends[trendName]
    result.trends[trendName] = {}

    for (const tagName in trend) {
      result.trends[trendName][tagName] = reportTrend(
        trend[tagName],
        percentiles
      )
    }
  }

  return result
}
