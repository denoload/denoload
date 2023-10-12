import { workerProcedureHandler } from '../rpc.ts'

declare const self: Worker

self.onmessage = workerProcedureHandler({
  double (nb: number): number {
    return nb * 2
  }
}, self.postMessage)
