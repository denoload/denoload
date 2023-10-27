import * as metrics from '@negrel/denoload-metrics'

import * as log from './log.ts'
import { workerProcedureHandler } from './rpc.ts'
import { VU } from './vu.ts'

declare const self: Worker

let logger = log.getLogger('worker/-1')

const VUs: Record<string, VU[]> = {}

self.onmessage = workerProcedureHandler({
  // NOTE: setupWorker MUST NOT be async.
  setupWorker (workerId: number): void {
    logger = log.getLogger(`worker/${workerId}`)
    logger.info('worker ready')
  },
  async iterations (
    moduleURL: string,
    scenarioName: string,
    nbIter: number,
    vuId: number,
    pollIntervalMillis: number,
    maxDurationMillis: number
  ): Promise<void> {
    const vu = new VU(vuId, pollIntervalMillis)
    if (VUs[scenarioName] === undefined) VUs[scenarioName] = []
    VUs[scenarioName].push(vu)

    await vu.doIterations(moduleURL, nbIter, maxDurationMillis)
  },
  iterationsDone (): Record<string, number> {
    const iterationsDone: Record<string, number> = {}
    for (const scenario in VUs) {
      const vus = VUs[scenario]
      let total = 0
      for (let i = 0; i < vus.length; i++) {
        total += vus[i].iterations
      }

      iterationsDone[scenario] = total
    }

    return iterationsDone
  },
  metrics (): metrics.RegistryObj {
    return metrics.mergeRegistryObjects(...Object.values(VUs).flat().map((v) => v.metrics()))
  }
}, self.postMessage)
