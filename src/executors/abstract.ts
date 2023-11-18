import { type ScenarioProgress } from '../scenario_progress.ts'
import { type ScenarioState } from '../scenario_state.ts'
import { type WorkerPool } from '../worker_pool.ts'

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
