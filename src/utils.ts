import * as metrics from '@negrel/denoload-metrics'

export function printMetrics (m: metrics.RegistryObj): void {
  console.log('\n')

  for (const trendName in m.trends) {
    const trendObj = m.trends[trendName]
    console.log(`  ${trendName}${'.'.repeat(24 - trendName.length)}: ${formatTrendTag(trendObj._)} total=${trendObj._.length}`)

    for (const [tagName, tag] of Object.entries(trendObj)) {
      if (tagName === '_') continue
      console.log(`      ${tagName}${'.'.repeat(20 - tagName.length)}: ${formatTrendTag(tag)} total=${trendObj._.length}`)
    }
  }

  console.log('\n')
}

function formatTrendTag (trend: number[]): string {
  const { avg, min, max, percentiles: [p90, p95, p99] } = metrics.trend(trend, [90, 95, 99])
  const avgStr = formatDuration(avg)
  const minStr = formatDuration(min)
  const maxStr = formatDuration(max)
  const p90Str = formatDuration(p90)
  const p95Str = formatDuration(p95)
  const p99Str = formatDuration(p99)

  return `avg=${avgStr}${' '.repeat(10 - avgStr.length)} min=${minStr}${' '.repeat(10 - minStr.length)}` +
    `max=${maxStr}${' '.repeat(10 - maxStr.length)} p(90)=${p90Str}${' '.repeat(10 - p90Str.length)}` +
    `p(95)=${p95Str}${' '.repeat(10 - p95Str.length)} p(99)=${p99Str}${' '.repeat(10 - p99Str.length)}`
}

export function formatDuration (nanoseconds: number): string {
  const microseconds = Math.floor(nanoseconds / 1000)
  const milliseconds = Math.floor(microseconds / 1000)
  const seconds = Math.floor(milliseconds / 1000)

  let result = `${microseconds.toFixed(3)}μs`
  if (milliseconds > 1) {
    result = `${Math.floor(milliseconds)}.${Math.round(microseconds % 1000)}ms`
  }

  if (seconds > 1) {
    result = `${Math.floor(seconds)}.${Math.round(milliseconds % 1000)}s`
  }

  return result
}
