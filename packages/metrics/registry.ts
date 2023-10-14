/**
 * Registry define a metrics registry. It is responsible of creating and storing
 * metrics.
 */
export class Registry {
  private readonly trends: Record<string, TrendMetric>
  private readonly counters: Record<string, CounterMetric>

  constructor () {
    this.trends = {}
    this.counters = {}
  }

  Trend (name: string): TrendMetric {
    if (this.trends[name] !== undefined) {
      return this.trends[name]
    }

    this.trends[name] = new TrendMetric()
    return this.trends[name]
  }

  Counter (name: string): CounterMetric {
    if (this.counters[name] !== undefined) {
      return this.counters[name]
    }

    this.counters[name] = new CounterMetric()
    return this.counters[name]
  }
}

export abstract class Metric {
  abstract add (value: number, ...tags: string[]): void
}

export class TrendMetric extends Metric {
  private readonly data: Record<string, number[]> = { _: [] }

  add (value: number, ...tags: string[]): void {
    for (const tag of tags) {
      if (this.data[tag] === undefined) {
        this.data[tag] = []
      }

      this.data[tag].push(value)
    }

    this.data._.push(value)
  }

  toJSON (): Record<string, number[]> {
    return this.data
  }
}

export class CounterMetric extends Metric {
  private readonly data: Record<string, number> = { _: 0 }

  add (value: number, ...tags: string[]): void {
    for (const tag of tags) {
      if (this.data[tag] === undefined) {
        this.data[tag] = 0
      }

      this.data[tag] += value
    }

    this.data._ += value
  }

  toJSON (): Record<string, number> {
    return this.data
  }
}

/**
 * RegistryObj define a Registry object after serialization.
 */
export interface RegistryObj {
  trends: Record<string, Record<string, number[]>>
  counters: Record<string, Record<string, number>>
}

/**
 * Merge the given registries object into base registry object.
 */
export function mergeRegistryObjects (...registries: RegistryObj[]): RegistryObj {
  const trends: RegistryObj['trends'] = { }
  const counters: RegistryObj['counters'] = { }

  for (const registry of registries) {
    for (const name in registry.trends) {
      if (trends[name] === undefined) {
        trends[name] = { _: [] }
      }

      for (const tag in registry.trends[name]) {
        if (trends[name][tag] === undefined) {
          trends[name][tag] = []
        }

        trends[name][tag].push(...registry.trends[name][tag])
      }
    }
    for (const name in registry.counters) {
      if (counters[name] === undefined) {
        counters[name] = { _: 0 }
      }

      for (const tag in registry.counters[name]) {
        if (counters[name][tag] === undefined) {
          counters[name][tag] = 0
        }

        counters[name][tag] += registry.counters[name][tag]
      }
    }
  }

  return { trends, counters }
}
