import { workerProcedureHandler } from '../rpc.ts'

declare const self: Worker

self.onmessage = workerProcedureHandler({
  error () {
    throw new Error('runtime error from worker')
  }
}, self.postMessage)
