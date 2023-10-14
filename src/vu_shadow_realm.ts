// ShadowRealm doesn't support asynchronous communication, we can't await
// promises in exported function.
/* eslint-disable @typescript-eslint/no-floating-promises */

import { globalRegistry } from '@negrel/denoload-metrics'

const iterationsTrend = globalRegistry.Trend('iterations')
const fetchTrend = globalRegistry.Trend('fetch')
let rawIterationsCounter = 0

/**
 * Start a floating promise that perform a single VU iteration.
 */
export function doIterations (moduleURL: string, vu: number, nbIter: number): void {
  alterGlobalThis()
  import(moduleURL).then(async (module) => {
    for (let i = 0; i < nbIter; i++) {
      const start = Bun.nanoseconds()

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
  const p = realGlobalThis.fetch(input, init)
  p.then((response) => {
    fetchTrend.add(Bun.nanoseconds() - start, response.statusText)
  }).catch((_error) => {
    fetchTrend.add(Bun.nanoseconds() - start, 'fail')
  })

  return p
}
