// ShadowRealm doesn't support asynchronous communication, we can't await
// promises in exported function.
/* eslint-disable @typescript-eslint/no-floating-promises */

import { globalRegistry } from '@negrel/denoload-metrics'
import { type ScenarioState } from './scenario_state'
import fetchCookie from 'fetch-cookie'

const iterationsTrend = globalRegistry.Trend('iterations')
const fetchTrend = globalRegistry.Trend('fetch')
const iterations = {
  success: 0,
  fail: 0
}

// Abort signal to limit scenario of duration (e.g gracefulStop).
let abortSignal = new AbortController().signal

/**
 * Start a floating promise that perform a single VU iteration.
 */
export function doIterations (moduleURL: string, vu: number, nbIter: number, maxDurationMillis: number, gracefulStopMillis: number): void {
  alterGlobalThis()

  import(moduleURL).then(async (module) => {
    abortSignal = AbortSignal.timeout(maxDurationMillis + gracefulStopMillis)

    let aborted = false
    abortSignal.onabort = () => { aborted = true }
    setTimeout(() => {
      aborted = true
    }, maxDurationMillis)

    for (let i = 0; i < nbIter; i++) {
      const start = Bun.nanoseconds()

      if (aborted) {
        break
      }

      try {
        await module.default(vu, i)

        iterationsTrend.add(Bun.nanoseconds() - start, 'success')
        iterations.success++
      } catch (err) {
        console.error(err)

        iterationsTrend.add(Bun.nanoseconds() - start, 'fail')
        iterations.fail++
      }
    }
  }).finally(restoreGlobalThis)
}

export function iterationsTotal (): number {
  return iterations.fail + iterations.success
}

export function aborted (): boolean {
  return abortSignal.aborted
}

export function jsonScenarioState (): string {
  const state: ScenarioState = {
    iterations,
    aborted: abortSignal.aborted
  }

  return JSON.stringify(state)
}

export function jsonMetricsRegistry (): string {
  return JSON.stringify(globalRegistry)
}

const realGlobalThis = {
  fetch: globalThis.fetch
}

function alterGlobalThis (): void {
  globalThis.fetch = fetchCookie(doFetch)
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
