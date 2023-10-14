import * as metrics from '@negrel/denoload-metrics'

import * as log from './log.ts'
import { workerProcedureHandler } from './rpc.ts'
import { VU } from './vu.ts'

declare const self: Worker

let logger = log.getLogger('worker/-1')

const VUs = [] as VU[]

self.onmessage = workerProcedureHandler({
  // NOTE: setupWorker MUST NOT be async.
  setupWorker (workerId: number): void {
    logger = log.getLogger(`worker/${workerId}`)
    logger.info('worker ready')
  },
  async iterations (moduleURL: string, nbIter: number, vuId: number, pollIntervalMillis: number): Promise<void> {
    const vu = new VU(vuId, pollIntervalMillis)
    VUs.push(vu)

    await vu.doIterations(moduleURL, nbIter)
  },
  iterationsDone (): number {
    let total = 0
    for (let i = 0; i < VUs.length; i++) {
      total += VUs[i].iterations
    }

    return total
  },
  metrics (): metrics.RegistryObj {
    return metrics.mergeRegistryObjects(...VUs.map((v) => v.metrics()))
  }
}, self.postMessage)
