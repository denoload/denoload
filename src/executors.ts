import { ExecutorKind, type ScenarioOptions } from './datatypes.ts'
import log from './log.ts'
import { WorkerPool } from './worker_pool.ts'

const logger = log.getLogger('main')
const encoder = new TextEncoder()

interface ScenarioProgress {
  scenarioName: string
  currentVus: number
  maxVus: number
  currentIterations: number
  maxIterations: number
  percentage: number
  extraInfos: string
}

/**
 * Executor are responsible for coordinating and managing the entire life cycle
 * of a scenario.
 *
 * This is the abstract base class that handle common tasks such as initializing
 * the worker pool.
 */
abstract class Executor {
  protected readonly workerPool: WorkerPool = new WorkerPool()
  private consoleReporterIntervalId: NodeJS.Timeout | null = null
  private consoleReporterCb = (): void => {}

  /**
   * Execute is the core logic of an executor.
   * It is responsible for executing the given scenario.
   *
   * @param moduleURL - URL of the module to execute.
   * @param scenarioName - Name of the scenario.
   * @param scenarioOptions - Options of the scenario to run.
   */
  abstract execute (
    moduleURL: URL,
    scenarioName: string,
    scenarioOptions: ScenarioOptions,
  ): Promise<void>

  abstract scenarioProgress (): Promise<ScenarioProgress>

  startConsoleReporter (): void {
    if (this.consoleReporterIntervalId !== null) {
      return
    }

    const startTime = new Date()
    const progressBarEmptyChar =
      '--------------------------------------------------'
    const progressBarFullChar =
      '=================================================='

    this.consoleReporterIntervalId = setInterval(async () => {
      const progress = await this.scenarioProgress()
      const duration = new Date().getTime() - startTime.getTime()
      const percentage = Math.floor(progress.percentage)

      process.stdout.write(
        encoder.encode(
          `running (${
            Math.round(duration / 1000)
          }s), ${progress.currentVus}/${progress.maxVus} VUs, ${progress.currentIterations}/${progress.maxIterations} iterations.\n`
        )
      )
      process.stdout.write(
        encoder.encode(
          `${progress.scenarioName} [${
            progressBarFullChar.slice(0, Math.floor(percentage / 2))
          }${
            progressBarEmptyChar.slice(0, 50 - Math.floor(percentage / 2))
          }]\n`
        )
      )

      this.consoleReporterCb()
    }, 1000)
  }

  stopConsoleReporter (): Promise<void> | void {
    if (this.consoleReporterIntervalId !== null) {
      return new Promise((resolve) => {
        this.consoleReporterCb = () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          clearInterval(this.consoleReporterIntervalId!)
          resolve(undefined)
        }
      })
    }
  }
}

/**
 * Per VU iteration executor managed a fixed amount of iteration per VU.
 */
export class ExecutorPerVuIteration extends Executor {
  private scenarioName = ''
  private currentVus = 0
  private maxVus = 0
  private totalIterations = 0

  override async execute (
    moduleURL: URL,
    scenarioName: string,
    scenarioOptions: ScenarioOptions
  ): Promise<void> {
    logger.info(`executing "${scenarioName}" scenario...`)
    this.maxVus = scenarioOptions.vus
    this.totalIterations = scenarioOptions.iterations * this.maxVus
    this.scenarioName = scenarioName

    this.startConsoleReporter()

    logger.debug('running VUs...')
    const scenarioStart = performance.now()
    const promises = new Array(scenarioOptions.vus)
    for (let vus = 0; vus < scenarioOptions.vus; vus++) {
      promises[vus] = this.workerPool.remoteProcedureCall({
        name: 'iterations',
        args: [moduleURL.toString(), scenarioOptions.iterations, vus]
      })
      this.currentVus++
    }

    // Wait end of all iterations.
    await Promise.all(promises)
    const scenarioEnd = performance.now()

    await this.workerPool.forEachWorkerRemoteProcedureCall({
      name: 'cleanupWorker',
      args: []
    })

    // Clean up.
    await this.stopConsoleReporter()
    this.workerPool.terminate()
    logger.debug('VUs ran.')

    logger.info(
      `scenario "${scenarioName}" successfully executed in ${
        scenarioEnd - scenarioStart
      }ms.`
    )
  }

  override async scenarioProgress (): Promise<ScenarioProgress> {
    const promises = await this.workerPool.forEachWorkerRemoteProcedureCall<never, number>({
      name: 'iterationsDone',
      args: []
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentIterations = promises.reduce((acc, p) => p.status === 'fulfilled' ? acc + p.value! : acc, 0)

    return {
      scenarioName: this.scenarioName,
      currentVus: this.currentVus,
      maxVus: this.maxVus,
      currentIterations,
      maxIterations: this.totalIterations,
      percentage: currentIterations / this.totalIterations * 100,
      extraInfos: ''
    }
  }
}

/**
 * Map of executors.
 */
const executors: { [key in ExecutorKind]: new () => Executor } = {
  [ExecutorKind.PerVuIteration]: ExecutorPerVuIteration
}

export default executors
