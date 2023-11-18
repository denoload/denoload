import { type WorkerPool } from '../worker_pool.ts'
import { type Executor } from './abstract.ts'
import { ExecutorConstantVus } from './constant_vus.ts'
import { ExecutorType, type ScenarioOptions } from './options.ts'
import { ExecutorPerVuIteration } from './per_vu_iterations.ts'

/**
 * Map of executors.
 */
const executors: {
  [key in ExecutorType]: new (
    workerPool: WorkerPool,
    scenarioName: string,
    moduleURL: URL,
    scenarioOptions: Partial<ScenarioOptions[key]>
  ) => Executor
} = {
  [ExecutorType.PerVuIteration]: ExecutorPerVuIteration,
  [ExecutorType.ConstantVus]: ExecutorConstantVus
}

export default executors

export { ExecutorType, type ScenarioOptions } from './options.ts'
export { Executor } from './abstract.ts'
