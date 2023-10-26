import { test, expect } from 'bun:test'
import { Registry, mergeRegistryObjects } from './registry.ts'

test('Create a new TrendMetric from a Registry', () => {
  const registry = new Registry()

  const trend = registry.Trend('my_trend')
  trend.add(1, 'foo', 'bar')
  trend.add(2, 'foo')
  trend.add(3, 'bar')
  trend.add(4)

  expect(JSON.parse(JSON.stringify(registry))).toEqual({
    trends: {
      my_trend: {
        _: [1, 2, 3, 4],
        foo: [1, 2],
        bar: [1, 3]
      }
    },
    counters: {}
  })
})

test('Create a new CounterMetric from a Registry', () => {
  const registry = new Registry()

  const counter = registry.Counter('my_counter')
  counter.add(1, 'foo', 'bar')
  counter.add(2, 'foo')
  counter.add(3, 'bar')
  counter.add(4)

  expect(JSON.parse(JSON.stringify(registry))).toEqual({
    trends: {},
    counters: {
      my_counter: {
        _: 10,
        foo: 3,
        bar: 4
      }
    }
  })
})

test('Merge multiple Registry into a single one', () => {
  const registryA = new Registry()
  const registryB = new Registry()

  // Common metrics
  for (const registry of [registryA, registryB]) {
    const counter = registry.Counter('my_counter')
    counter.add(1, 'foo', 'bar')
    counter.add(2, 'foo')
    counter.add(3, 'bar')
    counter.add(4)

    const trend = registry.Trend('my_trend')
    trend.add(1, 'foo', 'bar')
    trend.add(2, 'foo')
    trend.add(3, 'bar')
    trend.add(4)
  }

  // Unique metrics.
  registryA.Counter('only_a').add(9)
  registryA.Trend('only_a').add(18)

  registryB.Counter('only_b').add(18)
  registryB.Trend('only_b').add(9)

  // Merge metrics.
  const merged = mergeRegistryObjects(
    JSON.parse(JSON.stringify(registryA)),
    JSON.parse(JSON.stringify(registryB))
  )

  expect(merged).toEqual({
    counters: {
      my_counter: {
        _: 20,
        bar: 8,
        foo: 6
      },
      only_a: {
        _: 9
      },
      only_b: {
        _: 18
      }
    },
    trends: {
      my_trend: {
        _: [1, 2, 3, 4, 1, 2, 3, 4],
        foo: [1, 2, 1, 2],
        bar: [1, 3, 1, 3]
      },
      only_a: {
        _: [
          18
        ]
      },
      only_b: {
        _: [
          9
        ]
      }
    }
  })
})
