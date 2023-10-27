import type * as metrics from '@negrel/denoload-metrics'

export class VU {
  private readonly realm: ShadowRealm
  private readonly pollIntervalMillis: number
  private readonly id: number
  private _iterations = 0
  private jsonMetrics?: () => string

  constructor (id: number, pollIntervalMillis: number) {
    this.realm = new ShadowRealm()
    this.id = id
    this.pollIntervalMillis = pollIntervalMillis
  }

  get iterations (): number {
    return this._iterations
  }

  metrics (): metrics.RegistryObj {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return JSON.parse(this.jsonMetrics!()) as metrics.RegistryObj
  }

  // doIterations must not be called concurrently.
  async doIterations (moduleUrl: string, iterations: number, maxDurationMillis: number): Promise<void> {
    const doIterations = await this.realm.importValue('./vu_shadow_realm.ts', 'doIterations')
    const iterationsTotal: () => number = await this.realm.importValue('./vu_shadow_realm.ts', 'iterationsTotal')
    this.jsonMetrics = await this.realm.importValue('./vu_shadow_realm.ts', 'jsonMetricsRegistry')

    // Start iterations
    void doIterations(moduleUrl, this.id, iterations, maxDurationMillis)

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
        if (this._iterations - initialIterations === iterations) {
          clearInterval(intervalId)
          resolve(undefined)
        }
      }, this.pollIntervalMillis)
    })
  }
}
