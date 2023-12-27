import log from '../log.ts'
import { type ScenarioProgress } from '../scenario_progress.ts'
import { type ScenarioState } from '../scenario_state.ts'
import { formatDuration, parseDuration } from '../utils.ts'
import { type WorkerPool } from '../worker_pool.ts'
import { type IterationsOptions } from '../worker_script.ts'
import { Executor } from './abstract.ts'
import { ExecutorType, type ScenarioOptions } from './options.ts'

export interface PerVuIterationOption {
  executor: ExecutorType.PerVuIteration
}

const defaultPerVuIterationOption: ScenarioOptions[ExecutorType.PerVuIteration] =
  {
    executor: ExecutorType.PerVuIteration,
    iterations: 1,
    vus: 1,
    maxDuration: '10m',
    gracefulStop: '30s'
  }

/**
 * Per VU iteration executor managed a fixed amount of iteration per VU.
 */
export class ExecutorPerVuIteration extends Executor {
  private readonly logger = log.getLogger('executor-per-vu-iteration')
  private readonly moduleURL: URL
  private readonly options: ScenarioOptions[ExecutorType.PerVuIteration]

  private _currentVUs = 0
  private totalIterations = 0

  constructor (
    workerPool: WorkerPool,
    scenarioName: string,
    moduleURL: URL,
    options: Partial<ScenarioOptions[ExecutorType.PerVuIteration]>
  ) {
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
        maxDurationMillis: parseDuration(this.options.maxDuration) * 1000,
        gracefulStopMillis:
          parseDuration(this.options.gracefulStop ?? '0s') * 1000
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
      `scenario successfully executed in ${formatDuration(
        scenarioEnd - scenarioStart
      )}.`
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
      percentage: (iterations / this.totalIterations) * 100,
      extraInfos: '',
      aborted: state.aborted
    }
  }
}
