import * as log from './log.ts'
import { formatDuration } from './utils.ts'
import { type WorkerPool } from './worker_pool.ts'

export interface ScenarioProgress {
  percentage: number
  extraInfos: string
}

/**
 * Enumeration of available executors.
 */
export enum ExecutorKind {
  // A fixed amount of iteration per VU
  PerVuIteration = 'per-vu-iterations',
}

/**
 * ScenarioOptions defines options of a scenario exported by a test script.
 */
export interface ScenarioOptions {
  executor: ExecutorKind
  vus: number
  iterations: number
  maxDuration: number
}

/**
 * Executor are responsible for coordinating and managing the entire life cycle
 * of a scenario.
 *
 * This is the abstract base class that handle common tasks such as initializing
 * the worker pool.
 */
export abstract class Executor {
  protected readonly workerPool: WorkerPool
  public readonly scenarioName: string

  constructor (workerPool: WorkerPool, scenarioName: string) {
    this.workerPool = workerPool
    this.scenarioName = scenarioName
  }

  /**
   * Execute is the core logic of an executor.
   * It is responsible for executing the given scenario.
   *
   * @param moduleURL - URL of the module to execute.
   * @param scenarioName - Name of the scenario.
   * @param scenarioOptions - Options of the scenario to run.
   */
  abstract execute (): Promise<void>

  /**
   * maxVUs returns the total number of VUs used in this run.
   */
  abstract maxVUs (): number

  /**
   * currentVUs returns the current number of VUs.
   */
  abstract currentVUs (): number

  /**
   * Compute progress percentage.
   */
  abstract scenarioProgress (
    { startTime, iterationsDone }: { startTime: number, iterationsDone: number }
  ): ScenarioProgress
}

const defaultPerVuIterationOption: ScenarioOptions = {
  executor: ExecutorKind.PerVuIteration,
  iterations: 1,
  vus: 1,
  maxDuration: 30000 // 30s
}

/**
 * Per VU iteration executor managed a fixed amount of iteration per VU.
 */
export class ExecutorPerVuIteration extends Executor {
  private readonly logger = log.getLogger('executor-per-vu-iteration')
  private readonly moduleURL: URL
  private readonly options: ScenarioOptions

  private _currentVUs = 0
  private totalIterations = 0

  constructor (workerPool: WorkerPool, scenarioName: string, moduleURL: URL, options: Partial<ScenarioOptions>) {
    super(workerPool, scenarioName)
    this.moduleURL = moduleURL
    this.options = { ...defaultPerVuIterationOption, ...options }
  }

  override async execute (): Promise<void> {
    this.logger.info(`executing "${this.scenarioName}" scenario...`)
    this.totalIterations = this.options.iterations * this.options.vus

    this.logger.debug('running VUs...')
    const scenarioStart = Bun.nanoseconds()
    const promises = new Array(this.options.vus)
    for (let vus = 0; vus < this.options.vus; vus++) {
      promises[vus] = this.workerPool.remoteProcedureCall({
        name: 'iterations',
        args: [this.moduleURL.toString(), this.scenarioName, this.options.iterations, vus, 10, this.options.maxDuration]
      })
      this._currentVUs++
    }

    // Wait end of all iterations.
    await Promise.all(promises)
    this.logger.debug('VUs ran.')
    const scenarioEnd = Bun.nanoseconds()

    // Stop console reported test is done.
    this.logger.info(
      `scenario successfully executed in ${formatDuration(scenarioEnd - scenarioStart)}.`
    )
  }

  override currentVUs (): number {
    return this._currentVUs
  }

  override maxVUs (): number {
    return this.options.vus
  }

  override scenarioProgress (
    { iterationsDone }: { startTime: number, iterationsDone: number }
  ): ScenarioProgress {
    return {
      percentage: iterationsDone / this.totalIterations * 100,
      extraInfos: ''
    }
  }
}

/**
 * Map of executors.
 */
const executors: {
  [key in ExecutorKind]: new (
    workerPool: WorkerPool,
    scenarioName: string,
    moduleURL: URL,
    scenarioOptions: Partial<ScenarioOptions>
  ) => Executor
} = {
  [ExecutorKind.PerVuIteration]: ExecutorPerVuIteration
}

export default executors
