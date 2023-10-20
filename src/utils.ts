import * as metrics from '@negrel/denoload-metrics'

export function printMetrics (m: metrics.RegistryObj): void {
  console.log('\n')

  for (const trendName in m.trends) {
    const trendObj = m.trends[trendName]
    console.log(`  ${pad(trendName, '.', 24)}: ${formatTrendTag(trendObj._)} total=${trendObj._.length}`)

    for (const [tagName, tag] of Object.entries(trendObj)) {
      if (tagName === '_') continue
      console.log(`      ${pad(tagName, '.', 20)}: ${formatTrendTag(tag)} total=${tag.length}`)
    }
  }

  console.log('\n\n\n')
}

function formatTrendTag (trend: number[]): string {
  const { avg, min, max, percentiles: [p90, p95, p99] } = metrics.trend(trend, [90, 95, 99])
  const avgStr = formatDuration(avg)
  const minStr = formatDuration(min)
  const maxStr = formatDuration(max)
  const p90Str = formatDuration(p90)
  const p95Str = formatDuration(p95)
  const p99Str = formatDuration(p99)

  return `avg=${pad(avgStr, ' ', 10)} min=${pad(minStr, ' ', 10)}` +
    `max=${pad(maxStr, ' ', 10)} p(90)=${pad(p90Str, ' ', 10)}` +
    `p(95)=${pad(p95Str, ' ', 10)} p(99)=${pad(p99Str, ' ', 10)}`
}

export function formatDuration (nanoseconds: number): string {
  const microseconds = Math.floor(nanoseconds / 1000)
  const milliseconds = Math.floor(microseconds / 1000)
  const seconds = Math.floor(milliseconds / 1000)

  let result = `${microseconds}μs`
  if (milliseconds > 0) {
    result = `${milliseconds}.${microseconds % 1000}ms`
  }

  if (seconds > 0) {
    result = `${seconds}.${milliseconds % 1000}s`
  }

  return result
}

export function padLeft (str: string, p: string, size: number): string {
  return `${p.repeat(Math.max(size - str.length, 0))}${str}`
}

export function pad (str: string, p: string, size: number): string {
  return `${str}${p.repeat(Math.max(size - str.length, 0))}`
}
