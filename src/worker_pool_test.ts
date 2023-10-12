import { test, expect } from 'bun:test'
import { WorkerPool } from './worker_pool.ts'

test('worker pool produce no duplicate worker id', async () => {
  const poolOptions = {
    workerScript: new URL('./test_workers/worker_id.ts', import.meta.url),
    minWorker: 1,
    maxWorker: 4,
    maxTasksPerWorker: 1
  }
  const pool = new WorkerPool(poolOptions)

  const promises = []
  for (let i = 0; i < poolOptions.maxWorker; i++) {
    const p = pool.remoteProcedureCall({
      name: 'sleepAndReturnWorkerIdAndArgs',
      args: [i]
    })

    promises.push(p)
  }

  const results = await Promise.all(promises)

  expect(results).toEqual([
    { args: [0], workerId: 0 },
    { args: [1], workerId: 1 },
    { args: [2], workerId: 2 },
    { args: [3], workerId: 3 }
  ])

  pool.terminate()
})

test("worker pool doesn't create worker if existing worker aren't full", async () => {
  const poolOptions = {
    workerScript: new URL('./test_workers/worker_id.ts', import.meta.url),
    minWorker: 1,
    maxWorker: 4,
    maxTasksPerWorker: 2
  }
  const pool = new WorkerPool(poolOptions)

  const promises = []
  for (let i = 0; i < poolOptions.maxTasksPerWorker; i++) {
    const p = pool.remoteProcedureCall({
      name: 'sleepAndReturnWorkerIdAndArgs',
      args: [i]
    })

    promises.push(p)
  }

  const results = await Promise.all(promises)

  expect(results).toEqual([
    { args: [0], workerId: 0 },
    { args: [1], workerId: 0 }
  ])

  pool.terminate()
})

test('worker pool enqueue task if all workers are full', async () => {
  const poolOptions = {
    workerScript: new URL('./test_workers/worker_id.ts', import.meta.url),
    minWorker: 1,
    maxWorker: 2,
    maxTasksPerWorker: 2
  }
  const pool = new WorkerPool(poolOptions)

  const promises = []
  for (
    let i = 0;
    i < poolOptions.maxWorker * poolOptions.maxTasksPerWorker + 1;
    i++
  ) {
    const p = pool.remoteProcedureCall({
      name: 'sleepAndReturnWorkerIdAndArgs',
      args: [i]
    })

    promises.push(p)
  }

  const results = await Promise.all(promises)

  expect(results).toEqual([
    { args: [0], workerId: 0 },
    { args: [1], workerId: 0 },
    { args: [2], workerId: 1 },
    { args: [3], workerId: 1 },
    { args: [4], workerId: 0 }
  ])

  pool.terminate()
})

test("worker pool creates up to minWorker workers even if workers aren't full", async () => {
  const poolOptions = {
    workerScript: new URL('./test_workers/worker_id.ts', import.meta.url),
    minWorker: 2,
    maxWorker: 4,
    maxTasksPerWorker: 2
  }
  const pool = new WorkerPool(poolOptions)

  const promises = []
  for (
    let i = 0;
    i < poolOptions.maxWorker * poolOptions.maxTasksPerWorker;
    i++
  ) {
    const p = pool.remoteProcedureCall({
      name: 'sleepAndReturnWorkerIdAndArgs',
      args: [i]
    })

    promises.push(p)
  }

  const results = await Promise.all(promises)

  expect(results).toEqual([
    { args: [0], workerId: 0 },
    { args: [1], workerId: 1 },
    { args: [2], workerId: 0 },
    { args: [3], workerId: 1 },
    { args: [4], workerId: 2 },
    { args: [5], workerId: 2 },
    { args: [6], workerId: 3 },
    { args: [7], workerId: 3 }
  ])

  pool.terminate()
})
