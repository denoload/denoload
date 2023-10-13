// ShadowRealm doesn't support asynchronous communication, we can't await
// promises in exported function.
/* eslint-disable @typescript-eslint/no-floating-promises */

const metrics = {
  iterations: [] as number[],
  iterationsDone: 0,
  iterationsFailed: 0
}

/**
 * Start a floating promise that perform a single VU iteration.
 */
export function doIterations (moduleURL: string, vu: number, nbIter: number): void {
  alterGlobalThis()
  import(moduleURL).then(async (module) => {
    for (let i = 0; i < nbIter; i++) {
      try {
        const start = Bun.nanoseconds()
        await module.default(vu, i)

        metrics.iterations.push(Bun.nanoseconds() - start)
        metrics.iterationsDone++
      } catch (err) {
        console.error(err)

        metrics.iterationsFailed++
        continue
      }
    }
  }).finally(restoreGlobalThis)
}

export function iterationsDone (): number {
  return metrics.iterationsDone
}

export function iterationsFailed (): number {
  return metrics.iterationsFailed
}

export function iterationsTotal (): number {
  return metrics.iterationsDone + metrics.iterationsFailed
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
  // const start = Bun.nanoseconds()
  const p = realGlobalThis.fetch(input, init)
  // p.finally(() => metrics.fetch.push(['fetch', Bun.nanoseconds() - start]))

  return p
}
