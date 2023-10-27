// ShadowRealm doesn't support asynchronous communication, we can't await
// promises in exported function.
/* eslint-disable @typescript-eslint/no-floating-promises */

import { globalRegistry } from '@negrel/denoload-metrics'

const iterationsTrend = globalRegistry.Trend('iterations')
const fetchTrend = globalRegistry.Trend('fetch')
let rawIterationsCounter = 0

// Abort signal to limit max duration of iterations.
let abortSignal = AbortSignal.abort('uninitialized')

/**
 * Start a floating promise that perform a single VU iteration.
 */
export function doIterations (moduleURL: string, vu: number, nbIter: number, maxDurationMillis: number): void {
  alterGlobalThis()

  import(moduleURL).then(async (module) => {
    abortSignal = AbortSignal.timeout(maxDurationMillis)

    let aborted = false
    abortSignal.onabort = () => { aborted = true }

    for (let i = 0; i < nbIter; i++) {
      const start = Bun.nanoseconds()

      if (aborted) {
        iterationsTrend.add(Bun.nanoseconds() - start, 'skipped')
        rawIterationsCounter++
        continue
      }

      try {
        await module.default(vu, i)

        iterationsTrend.add(Bun.nanoseconds() - start, 'success')
      } catch (err) {
        console.error(err)

        iterationsTrend.add(Bun.nanoseconds() - start, 'fail')
      }

      rawIterationsCounter++
    }
  }).finally(restoreGlobalThis)
}

export function iterationsTotal (): number {
  return rawIterationsCounter
}

export function jsonMetricsRegistry (): string {
  return JSON.stringify(globalRegistry)
}

const realGlobalThis = {
  fetch: globalThis.fetch
}

function alterGlobalThis (): void {
  globalThis.fetch = doFetch
}

function restoreGlobalThis (): void {
  globalThis.fetch = realGlobalThis.fetch
}

function doFetch (input: string | URL | Request, init?: RequestInit): any {
  const start = Bun.nanoseconds()

  // Add global abort signal.
  if (init === undefined) {
    init = {
      signal: abortSignal
    }
  } else {
    init.signal = abortSignal
  }
  const p = realGlobalThis.fetch(input, init)

  p.then((response) => {
    fetchTrend.add(Bun.nanoseconds() - start, response.statusText)
  }).catch((_error) => {
    fetchTrend.add(Bun.nanoseconds() - start, 'fail')
  })

  return p
}
