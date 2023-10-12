import * as log from './log.ts'
import { workerProcedureHandler } from './rpc.ts'
import { IterationStatus } from './vu_shadow_realm.ts'

declare const self: Worker

let logger = log.getLogger('worker/-1')

self.onmessage = workerProcedureHandler({
  // NOTE: setupWorker MUST NOT be async.
  setupWorker (workerId: number): void {
    logger = log.getLogger(`worker/${workerId}`)
    logger.info('worker ready')
  },
  async iterations (moduleURL: string, nbIter: number, vu: number): Promise<void> {
    const realm = new ShadowRealm()
    const startIteration = await realm.importValue('./vu_shadow_realm.ts', 'startIteration')
    const iterationStatus = await realm.importValue('./vu_shadow_realm.ts', 'iterationStatus')
    const iterationError = await realm.importValue('./vu_shadow_realm.ts', 'iterationError')
    let intervalId: NodeJS.Timeout

    for (let i = 0; i < nbIter; i++) {
      startIteration(moduleURL, vu, i)
      await new Promise((resolve, _reject) => {
        // Poll iteration status regularly until iteration is done.
        intervalId = setInterval(() => {
          switch (iterationStatus()) {
            case IterationStatus.Running:
              return

            case IterationStatus.Error:
              logger.error(`VU: ${vu}, iteration: ${i}, error: ${iterationError()}`)
              // fallthrough
            case IterationStatus.Done:
              // fallthrough
          }

          clearInterval(intervalId)
          resolve(undefined)
        }, 10)
      })
    }
  },
  async cleanupWorker (): Promise<void> {
  }
}, self.postMessage)
