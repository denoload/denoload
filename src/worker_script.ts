import * as metrics from './metrics'

import * as log from './log.ts'
import { workerProcedureHandler } from './rpc.ts'
import { VU } from './vu/index.ts'
import { type ScenarioState, mergeScenarioState } from './scenario_state.ts'

export interface IterationsOptions {
  moduleURL: string
  scenarioName: string
  nbIter: number
  vuId: number
  pollIntervalMillis: number
  maxDurationMillis: number
  gracefulStopMillis: number
}

declare const self: Worker

let logger = log.getLogger('worker/-1')

const VUs: Record<string, VU[]> = {}

self.onmessage = workerProcedureHandler(
  {
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
      maxDurationMillis,
      gracefulStopMillis
    }: IterationsOptions): Promise<void> {
      if (VUs[scenarioName] === undefined) VUs[scenarioName] = []
      const vu = VUs[scenarioName][vuId] ?? new VU(vuId, pollIntervalMillis)

      await vu.doIterations(
        moduleURL,
        nbIter,
        maxDurationMillis,
        gracefulStopMillis
      )
    },
    scenariosState (): Record<string, ScenarioState> {
      const states: Record<string, ScenarioState> = {}
      for (const scenario in VUs) {
        states[scenario] = mergeScenarioState(
          ...VUs[scenario].map((v) => v.scenarioState())
        )
      }

      return states
    },
    metrics (): metrics.RegistryObj {
      return metrics.mergeRegistryObjects(
        ...Object.values(VUs)
          .flat()
          .map((v) => v.metrics())
      )
    }
  },
  self.postMessage.bind(self)
)
