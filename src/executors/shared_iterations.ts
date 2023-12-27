import log from '../log.ts'
import { type ScenarioProgress } from '../scenario_progress.ts'
import { type ScenarioState } from '../scenario_state.ts'
import { formatDuration, parseDuration } from '../utils.ts'
import { type WorkerPool } from '../worker_pool.ts'
import { type IterationsOptions } from '../worker_script.ts'
import { Executor } from './abstract.ts'
import { ExecutorType, type ScenarioOptions } from './options.ts'

export interface SharedIterationsOption {
  executor: ExecutorType.SharedIterations
}

const defaultSharedIterationsOption: ScenarioOptions[ExecutorType.SharedIterations] =
  {
    executor: ExecutorType.SharedIterations,
    iterations: 1,
    vus: 1,
    maxDuration: '10m',
    gracefulStop: '30s'
  }

/**
 * Shared iterations executor shares iterations between the number of VUs.
 */
export class ExecutorSharedIterations extends Executor {
  private readonly logger = log.getLogger('executor-shared-iterations')
  private readonly moduleURL: URL
  private readonly options: ScenarioOptions[ExecutorType.SharedIterations]

  private _currentVUs = 0

  constructor (
    workerPool: WorkerPool,
    scenarioName: string,
    moduleURL: URL,
    options: Partial<ScenarioOptions[ExecutorType.SharedIterations]>
  ) {
    super(workerPool, scenarioName)
    this.moduleURL = moduleURL
    this.options = { ...defaultSharedIterationsOption, ...options }
  }

  override async execute (): Promise<void> {
    this.logger.info(`executing "${this.scenarioName}" scenario...`)

    let iterations = 0

    this.logger.debug('running VUs...')
    const scenarioStart = Bun.nanoseconds()
    const promises = new Array(this.options.vus)

    const maxDurationMillis = parseDuration(this.options.maxDuration) * 1000
    const gracefulStopMillis =
      parseDuration(this.options.gracefulStop ?? '0s') * 1000
    const abortTimestamp = scenarioStart + maxDurationMillis * 1000 * 1000

    const handleVU = async (vuId: number): Promise<void> => {
      // All iterations done.
      if (iterations >= this.options.iterations) {
        promises[vuId] = null
        return
      }
      this._currentVUs++

      // Remaining iterations.
      while (iterations < this.options.iterations) {
        iterations++

        const options: IterationsOptions = {
          moduleURL: this.moduleURL.toString(),
          scenarioName: this.scenarioName,
          nbIter: 1,
          vuId,
          pollIntervalMillis: 10,
          maxDurationMillis:
            (abortTimestamp - Bun.nanoseconds()) / (1000 * 1000),
          gracefulStopMillis
        }

        if (options.maxDurationMillis <= 0) {
          return
        }

        await this.workerPool.remoteProcedureCall({
          name: 'iterations',
          args: [options]
        })
      }
    }

    for (let vuId = 0; vuId < this.options.vus; vuId++) {
      promises[vuId] = handleVU(vuId)
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

  override maxVUs (): number {
    return this.options.vus
  }

  override currentVUs (): number {
    return this._currentVUs
  }

  override scenarioProgress (state: ScenarioState): ScenarioProgress {
    const iterations = state.iterations.success + state.iterations.fail
    return {
      percentage: (iterations / this.options.iterations) * 100,
      extraInfos: '',
      aborted: state.aborted
    }
  }
}
