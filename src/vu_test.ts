import { test, expect } from 'bun:test'
import { VU } from './vu'

test('VU doIterations failed fetch and iteration produce trends with fail tag', async () => {
  const vu = new VU(0, 10)

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 1, 1000)

  const metrics = vu.metrics()
  expect(metrics).toMatchObject({
    trends: {
      iterations: {
        _: expect.any(Array),
        fail: expect.any(Array)
      },
      fetch: {
        _: expect.any(Array),
        fail: expect.any(Array)
      }
    },
    counters: {}
  })
})

test('VU doIterations with success fetch and iteration produce trends with success tag', async () => {
  const vu = new VU(0, 10)

  const server = Bun.serve({
    port: 8000,
    fetch () {
      return new Response('Hello world')
    }
  })

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 1, 1000)

  const metrics = vu.metrics()
  expect(metrics).toMatchObject({
    trends: {
      iterations: {
        _: expect.any(Array),
        success: expect.any(Array)
      },
      fetch: {
        _: expect.any(Array),
        OK: expect.any(Array)
      }
    },
    counters: {}
  })

  server.stop(true)
})

test('VU doIterations with catched fetch error and successful iteration produce trends with fail and success tag respectively', async () => {
  const vu = new VU(0, 10)

  await vu.doIterations('./test_vu_script/fetch_localhost_catch.ts', 1, 1000)

  const metrics = vu.metrics()
  expect(metrics).toMatchObject({
    trends: {
      iterations: {
        _: expect.any(Array),
        success: expect.any(Array)
      },
      fetch: {
        _: expect.any(Array),
        fail: expect.any(Array)
      }
    },
    counters: {}
  })
})

test('VU iterations total current iterations done even with multiple doIterations call', async () => {
  const vu = new VU(0, 10)

  expect(vu.iterations).toBe(0)

  await vu.doIterations('./test_vu_script/fetch_localhost_catch.ts', 2, 1000)

  expect(vu.iterations).toBe(2)

  await vu.doIterations('./test_vu_script/fetch_localhost_catch.ts', 3, 1000)

  expect(vu.iterations).toBe(5)
})

test('VU timeout if iterations exceed maxDuration', async () => {
  const vu = new VU(0, 10)

  const iterationsTimeout = 1000 // 1s

  const server = Bun.serve({
    port: 8000,
    async fetch () {
      // Sleep a little so 2nd iteration timeout.
      await Bun.sleep(iterationsTimeout * 0.75)
      return new Response('Hello world')
    }
  })

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 2, iterationsTimeout)

  const metrics = vu.metrics()
  expect(metrics).toMatchObject({
    trends: {
      iterations: {
        _: expect.any(Array),
        success: expect.any(Array),
        fail: expect.any(Array)
      },
      fetch: {
        _: expect.any(Array),
        OK: expect.any(Array),
        fail: expect.any(Array)
      }
    },
    counters: {}
  })

  server.stop(true)
})

test('VU timeout and abort fetch if iterations exceed max duration', async () => {
  const vu = new VU(0, 10)

  const iterationsTimeout = 1000 // 1s

  const server = Bun.serve({
    port: 8000,
    async fetch () {
      // Sleep a little so 2nd iteration timeout.
      await Bun.sleep(iterationsTimeout * 0.75)
      return new Response('Hello world')
    }
  })

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 2, iterationsTimeout)

  const metrics = vu.metrics()
  expect(metrics).toMatchObject({
    trends: {
      iterations: {
        _: expect.any(Array),
        success: expect.any(Array),
        fail: expect.any(Array)
      },
      fetch: {
        _: expect.any(Array),
        OK: expect.any(Array),
        fail: expect.any(Array)
      }
    },
    counters: {}
  })

  server.stop(true)
})

test('VU timeout and skip remaining iterations if iterations exceed max duration', async () => {
  const vu = new VU(0, 10)

  const iterationsTimeout = 1000 // 1s

  const server = Bun.serve({
    port: 8000,
    async fetch () {
      // Timeout on first iteration.
      await Bun.sleep(iterationsTimeout * 2)
      return new Response('Hello world')
    }
  })

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 2, iterationsTimeout)

  const metrics = vu.metrics()
  expect(metrics).toMatchObject({
    trends: {
      iterations: {
        _: expect.any(Array),
        fail: expect.any(Array), // First iteration failed due to abort error.
        skipped: expect.any(Array) // Second iteration was skipped.
      },
      fetch: {
        _: expect.any(Array),
        fail: expect.any(Array)
      }
    },
    counters: {}
  })

  server.stop(true)
})
