export function formatDuration (nanoseconds: number): string {
  const microseconds = Math.floor(nanoseconds / 1000)
  const milliseconds = Math.floor(microseconds / 1000)
  const seconds = Math.floor(milliseconds / 1000)

  let result = `${microseconds}.${nanoseconds}μs`
  if (milliseconds > 1) {
    result = `${milliseconds}.${microseconds % 1000}ms`
  }

  if (seconds > 1) {
    result = `${seconds}.${milliseconds % 1000}s`
  }

  return result
}
