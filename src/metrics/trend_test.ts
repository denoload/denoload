import { test, expect } from 'bun:test'

import { trend } from './trend.ts'

test('trend of [100; 200] with p(50), p(90), p(99)', () => {
  const data = []
  for (let i = 100; i <= 200; i++) {
    data.push(i)
  }
  const t = trend(data, [50, 90, 99])

  expect(t).toEqual({
    min: 100,
    max: 200,
    avg: 150,
    percentiles: {
      50: 150,
      90: 190,
      99: 199
    },
    total: 101
  })
})
