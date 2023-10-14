import { test, expect } from 'bun:test'
import { Registry } from './registry.ts'

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
