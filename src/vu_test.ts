import { test, expect } from 'bun:test'
import { VU } from './vu'

test('VU doIterations failed fetch and iteration produce trends with fail tag', async () => {
  const vu = new VU(0, 10)

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 1, 1000, 0)

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

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 1, 1000, 0)

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

  await vu.doIterations('./test_vu_script/fetch_localhost_catch.ts', 1, 1000, 0)

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

  expect(vu.scenarioState()).toEqual({ iterations: { fail: 0, success: 0 }, aborted: false })

  await vu.doIterations('./test_vu_script/fetch_localhost_catch.ts', 2, 1000, 0)

  expect(vu.scenarioState()).toEqual({ iterations: { fail: 0, success: 2 }, aborted: false })

  await vu.doIterations('./test_vu_script/fetch_localhost_catch.ts', 3, 1000, 0)

  expect(vu.scenarioState()).toEqual({ iterations: { fail: 0, success: 5 }, aborted: false })
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

  // Third iteration will be skipped
  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 3, iterationsTimeout, 0)

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

  const state = vu.scenarioState()
  expect(state).toMatchObject({
    iterations: { fail: 1, success: 1 }, // Only to iterations ran.
    aborted: true
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

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 2, iterationsTimeout, 0)

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

  server.stop(true)
})

test('VU timeout but finish last iteration thanks to gracefulStop', async () => {
  const vu = new VU(0, 10)

  const iterationsTimeout = 1000 // 1s
  const gracefulStop = 2000 // 1s

  const server = Bun.serve({
    port: 8000,
    async fetch () {
      // Timeout on first iteration.
      await Bun.sleep(iterationsTimeout * 2)
      return new Response('Hello world')
    }
  })

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 1, iterationsTimeout, gracefulStop)

  const metrics = vu.metrics()
  expect(metrics).toMatchObject({
    trends: {
      iterations: {
        _: expect.any(Array)
      },
      fetch: {
        _: expect.any(Array)
      }
    },
    counters: {}
  })

  server.stop(true)
})

test('VU timeout and failed to finish last iteration before gracefulStop', async () => {
  const vu = new VU(0, 10)

  const iterationsTimeout = 1000 // 1s
  const gracefulStop = 2000 // 1s

  const server = Bun.serve({
    port: 8000,
    async fetch () {
      // Timeout on first iteration.
      await Bun.sleep(iterationsTimeout * 2)
      return new Response('Hello world')
    }
  })

  await vu.doIterations('./test_vu_script/fetch_localhost.ts', 3, iterationsTimeout, gracefulStop)

  const metrics = vu.metrics()
  expect(JSON.parse(JSON.stringify(metrics))).toMatchObject({
    trends: {
      iterations: {
        success: expect.any(Array),
        _: expect.any(Array)
      },
      fetch: {
        OK: expect.any(Array),
        _: expect.any(Array)
      }
    },
    counters: {}
  })

  expect(metrics.trends.iterations.success).toHaveLength(1)
  expect(metrics.trends.iterations._).toHaveLength(1)

  server.stop(true)
})

test('VUs cookie jar are isolated', async () => {
  const vus = []
  for (let i = 0; i < 3; i++) {
    vus.push(new VU(i, 10))
  }

  let cookiesReceived: Array<string | null> = []

  const server = Bun.serve({
    port: 8000,
    async fetch (req) {
      // Store received cookies
      cookiesReceived.push(req.headers.get('Cookie'))

      return new Response('Hello world', {
        headers: {
          'Set-Cookie': `cookie=${new Date().toISOString()}`
        }
      })
    }
  })

  // Perform iterations.
  for (const vu of vus) {
    await vu.doIterations('./test_vu_script/post_localhost_date.ts', 1, 3000, 0)
  }

  // First request of each VUs has no cookie.
  expect(cookiesReceived.filter(c => c === null)).toHaveLength(3)

  // Filter null cookies.
  cookiesReceived = cookiesReceived.filter(c => c !== null)

  // No duplicate cookie.
  const hasDuplicate = new Set(cookiesReceived).size !== cookiesReceived.length
  expect(hasDuplicate).toBeFalse()

  server.stop(true)
})
