import { type Metrics } from './metrics.ts'

export class VU {
  private readonly realm: ShadowRealm
  private readonly pollIntervalMillis: number
  private readonly id: number
  private _iterations = 0

  constructor (id: number, pollIntervalMillis: number) {
    this.realm = new ShadowRealm()
    this.id = id
    this.pollIntervalMillis = pollIntervalMillis
  }

  get iterations (): number {
    return this._iterations
  }

  async metrics (): Promise<Metrics> {
    const jsonMetrics: () => string = await this.realm.importValue('./vu_shadow_realm.ts', 'jsonMetrics')
    return JSON.parse(jsonMetrics()) as Metrics
  }

  async doIterations (moduleUrl: string, iterations: number): Promise<void> {
    const doIterations = await this.realm.importValue('./vu_shadow_realm.ts', 'doIterations')
    const iterationsTotal: () => number = await this.realm.importValue('./vu_shadow_realm.ts', 'iterationsTotal')

    // Start iterations
    void doIterations(moduleUrl, this.id, iterations)

    // Poll VU progress.
    let intervalId: NodeJS.Timeout
    await new Promise((resolve, _reject) => {
      // Poll iteration status regularly until iteration is done.
      intervalId = setInterval(() => {
        this._iterations = iterationsTotal()
        if (this._iterations === iterations) {
          clearInterval(intervalId)
          resolve(undefined)
        }
      }, this.pollIntervalMillis)
    })
  }
}
