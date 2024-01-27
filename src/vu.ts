import type * as metrics from './metrics'
import { type ScenarioState } from './scenario_state'

export class VU {
  private readonly realm: ShadowRealm
  private readonly pollIntervalMillis: number
  private readonly id: number
  private _iterations = 0
  private jsonMetrics?: () => string
  private jsonScenarioState?: () => string

  constructor (id: number, pollIntervalMillis: number) {
    this.realm = new ShadowRealm()
    this.id = id
    this.pollIntervalMillis = pollIntervalMillis
  }

  scenarioState (): ScenarioState {
    if (this.jsonScenarioState === undefined) {
      return {
        iterations: { fail: 0, success: 0 },
        aborted: false
      }
    }

    return JSON.parse(this.jsonScenarioState()) as ScenarioState
  }

  metrics (): metrics.RegistryObj {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return JSON.parse(this.jsonMetrics!()) as metrics.RegistryObj
  }

  // doIterations must not be called concurrently.
  async doIterations (
    moduleUrl: string,
    iterations: number,
    maxDurationMillis: number,
    gracefulStopMillis: number
  ): Promise<void> {
    const doIterations = await this.realm.importValue(
      './vu_shadow_realm.ts',
      'doIterations'
    )
    const iterationsTotal: () => number = await this.realm.importValue(
      './vu_shadow_realm.ts',
      'iterationsTotal'
    )
    const iterationsAborted: () => boolean = await this.realm.importValue(
      './vu_shadow_realm.ts',
      'aborted'
    )
    this.jsonMetrics = await this.realm.importValue(
      './vu_shadow_realm.ts',
      'jsonMetricsRegistry'
    )
    this.jsonScenarioState = await this.realm.importValue(
      './vu_shadow_realm.ts',
      'jsonScenarioState'
    )

    // Start iterations
    void doIterations(
      moduleUrl,
      this.id,
      iterations,
      maxDurationMillis,
      gracefulStopMillis
    )

    // Initial number of iterations.
    const initialIterations = this._iterations

    // Poll VU progress.
    let intervalId: NodeJS.Timeout
    await new Promise((resolve, _reject) => {
      // Poll iteration status regularly until iteration is done.
      intervalId = setInterval(() => {
        // Update total iterations counter.
        this._iterations = iterationsTotal()

        // Stop condition.
        if (
          this._iterations - initialIterations === iterations ||
          iterationsAborted()
        ) {
          clearInterval(intervalId)
          resolve(undefined)
        }
      }, this.pollIntervalMillis)
    })
  }
}
