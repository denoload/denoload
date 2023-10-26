import * as metrics from '@negrel/denoload-metrics'

export function printMetrics (m: metrics.RegistryObj): void {
  console.log('\n')

  const rows: string[][] = []

  for (const trendName in m.trends) {
    const trendObj = m.trends[trendName]

    rows.push([`  ${pad(trendName, '.', 24)}:`, ...formatTrendTag(trendObj._), `total=${trendObj._.length}`])

    for (const [tagName, tag] of Object.entries(trendObj)) {
      if (tagName === '_') continue

      rows.push([`      ${pad(tagName, '.', 20)}:`, ...formatTrendTag(tag), `total=${tag.length}`])
    }
  }

  console.log(formatTab(rows, '   ').join('\n'), '\n\n\n')
}

function formatTrendTag (trend: number[]): string[] {
  const { avg, min, max, percentiles: [med, p90, p95, p99] } = metrics.trend(trend, [50, 90, 95, 99])
  const avgStr = formatDuration(avg)
  const minStr = formatDuration(min)
  const maxStr = formatDuration(max)
  const medStr = formatDuration(med)
  const p90Str = formatDuration(p90)
  const p95Str = formatDuration(p95)
  const p99Str = formatDuration(p99)

  return [
    `avg=${avgStr}`,
    `min=${minStr}`,
    `max=${maxStr}`,
    `med=${medStr}`,
    `p(90)=${p90Str}`,
    `p(95)=${p95Str}`,
    `p(99)=${p99Str}`
  ]
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

export function formatTab (rows: string[][], colSep = ' '): string[] {
  const maxRowLength = rows.reduce((acc, r) => Math.max(acc, r.length), 0)
  const maxLengthPerColumn: number[] = new Array(maxRowLength).fill(0)

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const col = row[i]
      maxLengthPerColumn[i] = Math.max(col.length, maxLengthPerColumn[i])
    }
  }

  const result: string[] = []

  for (const row of rows) {
    const line: string[] = []
    for (let i = 0; i < row.length; i++) {
      line.push(pad(row[i], ' ', maxLengthPerColumn[i]))
    }

    result.push(line.join(colSep))
  }

  return result
}

export function padLeft (str: string, p: string, size: number): string {
  return `${p.repeat(Math.max(size - str.length, 0))}${str}`
}

export function pad (str: string, p: string, size: number): string {
  return `${str}${p.repeat(Math.max(size - str.length, 0))}`
}
