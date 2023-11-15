import * as metrics from '@negrel/denoload-metrics'

import * as log from './log.ts'
import { workerProcedureHandler } from './rpc.ts'
import { VU } from './vu.ts'
import { type ScenarioState, mergeScenarioState } from './scenario_state.ts'

export interface IterationsOptions {
  moduleURL: string
  scenarioName: string
  nbIter: number
  vuId: number
  pollIntervalMillis: number
  maxDurationMillis: number
}

declare const self: Worker

let logger = log.getLogger('worker/-1')

const VUs: Record<string, VU[]> = {}

self.onmessage = workerProcedureHandler({
  // NOTE: setupWorker MUST NOT be async.
  setupWorker (workerId: number): void {
    logger = log.getLogger(`worker/${workerId}`)
    logger.info('worker ready')
  },
  async iterations ({
    moduleURL,
    scenarioName,
    nbIter,
    vuId,
    pollIntervalMillis,
    maxDurationMillis
  }: IterationsOptions): Promise<void> {
    const vu = new VU(vuId, pollIntervalMillis)
    if (VUs[scenarioName] === undefined) VUs[scenarioName] = []
    VUs[scenarioName].push(vu)

    await vu.doIterations(moduleURL, nbIter, maxDurationMillis)
  },
  scenariosState (): Record<string, ScenarioState> {
    const states: Record<string, ScenarioState> = {}
    for (const scenario in VUs) {
      states[scenario] = mergeScenarioState(...VUs[scenario].map((v) => v.scenarioState()))
    }

    return states
  },
  metrics (): metrics.RegistryObj {
    return metrics.mergeRegistryObjects(...Object.values(VUs).flat().map((v) => v.metrics()))
  }
}, self.postMessage)
