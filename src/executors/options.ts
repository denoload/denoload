/**
 * Enumeration of available executors.
 */
export enum ExecutorType {
  // A fixed amount of iteration per VU.
  PerVuIteration = 'per-vu-iterations',
  // A fixed number of VUs execute as many iterations as possible for a
  // specified amount of time.
  ConstantVus = 'constant-vus'
}

/**
 * ScenarioOptions defines options of a scenario exported by a test script.
 */
export interface ScenarioOptions {
  [ExecutorType.PerVuIteration]: {
    executor: ExecutorType.PerVuIteration
    vus: number
    iterations: number
    maxDuration: string
    gracefulStop?: string
  }
  [ExecutorType.ConstantVus]: {
    executor: ExecutorType.ConstantVus
    vus: number
    duration: string
    gracefulStop?: string
  }
}
