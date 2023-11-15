import * as log from './log.ts'
import { type ScenarioProgress } from './scenario_progress.ts'
import { type ScenarioState } from './scenario_state.ts'
import { formatDuration } from './utils.ts'
import { type WorkerPool } from './worker_pool.ts'
import { type IterationsOptions } from './worker_script.ts'

/**
 * Enumeration of available executors.
 */
export enum ExecutorKind {
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
  [ExecutorKind.PerVuIteration]: {
    executor: ExecutorKind.PerVuIteration
    vus: number
    iterations: number
    maxDuration: number
  }
  [ExecutorKind.ConstantVus]: {
    executor: ExecutorKind.ConstantVus
    vus: number
    duration: number
  }
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
   * Compute scenario progress based on its state.
   */
  abstract scenarioProgress (state: ScenarioState): ScenarioProgress
}

const defaultPerVuIterationOption: ScenarioOptions[ExecutorKind.PerVuIteration] = {
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
  private readonly options: ScenarioOptions[ExecutorKind.PerVuIteration]

  private _currentVUs = 0
  private totalIterations = 0

  constructor (workerPool: WorkerPool, scenarioName: string, moduleURL: URL, options: Partial<ScenarioOptions[ExecutorKind.PerVuIteration]>) {
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
      const options: IterationsOptions = {
        moduleURL: this.moduleURL.toString(),
        scenarioName: this.scenarioName,
        nbIter: this.options.iterations,
        vuId: vus,
        pollIntervalMillis: 10,
        maxDurationMillis: this.options.maxDuration
      }

      promises[vus] = this.workerPool.remoteProcedureCall({
        name: 'iterations',
        args: [options]
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

  override scenarioProgress (state: ScenarioState): ScenarioProgress {
    const iterations = state.iterations.success + state.iterations.fail
    return {
      percentage: iterations / this.totalIterations * 100,
      extraInfos: '',
      aborted: state.aborted
    }
  }
}

const defaultConstantVusOption: ScenarioOptions[ExecutorKind.ConstantVus] = {
  executor: ExecutorKind.ConstantVus,
  vus: 128,
  duration: 30_000
}

/**
 * Constant VUs iteration executor execute as many iterations as possible for a
 * specified amount of time.
 */
class ExecutorConstantVus extends Executor {
  private readonly logger = log.getLogger('executor-per-vu-iteration')
  private readonly moduleURL: URL
  private readonly options: ScenarioOptions[ExecutorKind.ConstantVus]
  private startDate: Date
  private readonly endDate: Date

  constructor (
    workerPool: WorkerPool,
    scenarioName: string,
    moduleURL: URL,
    options: Partial<ScenarioOptions[ExecutorKind.ConstantVus]>
  ) {
    super(workerPool, scenarioName)
    this.moduleURL = moduleURL
    this.options = { ...defaultConstantVusOption, ...options }
    this.startDate = new Date()
    this.endDate = new Date()
  }

  async execute (): Promise<void> {
    this.logger.info(`executing "${this.scenarioName}" scenario...`)
    this.startDate = new Date()
    this.endDate.setTime(this.startDate.getTime() + (this.options.duration * 1000))

    this.logger.debug('running VUs...')
    const scenarioStart = Bun.nanoseconds()
    const promises = new Array(this.options.vus)
    for (let vus = 0; vus < this.options.vus; vus++) {
      const options: IterationsOptions = {
        moduleURL: this.moduleURL.toString(),
        scenarioName: this.scenarioName,
        nbIter: Number.MAX_SAFE_INTEGER,
        vuId: vus,
        pollIntervalMillis: 10,
        maxDurationMillis: this.endDate.getTime() - this.startDate.getTime()
      }

      promises[vus] = this.workerPool.remoteProcedureCall({
        name: 'iterations',
        args: [options]
      })
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

  maxVUs (): number {
    return this.options.vus
  }

  currentVUs (): number {
    return this.options.vus
  }

  scenarioProgress (state: ScenarioState): ScenarioProgress {
    const now = new Date().getTime() - this.startDate.getTime()
    const end = this.endDate.getTime() - this.startDate.getTime()

    return {
      percentage: now / end * 100,
      extraInfos: '',
      aborted: state.aborted
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
    scenarioOptions: Partial<ScenarioOptions[key]>
  ) => Executor
} = {
  [ExecutorKind.PerVuIteration]: ExecutorPerVuIteration,
  [ExecutorKind.ConstantVus]: ExecutorConstantVus
}

export default executors
