import * as log from '../log.ts'
import { type ScenarioProgress } from '../scenario_progress.ts'
import { type ScenarioState } from '../scenario_state.ts'
import { formatDuration, parseDuration } from '../utils.ts'
import { type WorkerPool } from '../worker_pool.ts'
import { type IterationsOptions } from '../worker_script.ts'
import { Executor } from './abstract.ts'
import { ExecutorType, type ScenarioOptions } from './options.ts'

const defaultConstantVusOption: ScenarioOptions[ExecutorType.ConstantVus] = {
  executor: ExecutorType.ConstantVus,
  vus: 1,
  // Duration is required.
  duration: '0s'
}

/**
 * Constant VUs iteration executor execute as many iterations as possible for a
 * specified amount of time.
 */
export class ExecutorConstantVus extends Executor {
  private readonly logger = log.getLogger('executor-constant-vus')
  private readonly moduleURL: URL
  private readonly options: ScenarioOptions[ExecutorType.ConstantVus]
  private startDate: Date
  private readonly endDate: Date

  constructor (
    workerPool: WorkerPool,
    scenarioName: string,
    moduleURL: URL,
    options: Partial<ScenarioOptions[ExecutorType.ConstantVus]>
  ) {
    super(workerPool, scenarioName)
    this.moduleURL = moduleURL
    if (typeof options.duration !== 'string') {
      throw new Error(`duration option missing for scenario ${scenarioName}`)
    }
    this.options = { ...defaultConstantVusOption, ...options }
    this.startDate = new Date()
    this.endDate = new Date()
  }

  async execute (): Promise<void> {
    this.logger.info(`executing "${this.scenarioName}" scenario...`)
    this.startDate = new Date()
    this.endDate.setTime(
      this.startDate.getTime() + parseDuration(this.options.duration) * 1000
    )

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
        maxDurationMillis: this.endDate.getTime() - this.startDate.getTime(),
        gracefulStopMillis:
          parseDuration(this.options.gracefulStop ?? '0s') * 1000
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
      `scenario successfully executed in ${formatDuration(
        scenarioEnd - scenarioStart
      )}.`
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
    let percentage = (now / end) * 100
    if (now >= end) {
      percentage = 100
    }

    return {
      percentage,
      extraInfos: '',
      aborted: state.aborted
    }
  }
}
