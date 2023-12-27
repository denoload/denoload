import { workerProcedureHandler } from '../rpc.ts'

declare const self: Worker

self.onmessage = workerProcedureHandler(
  {
    async sleep (ms: number): Promise<void> {
      await Bun.sleep(ms)
    }
  },
  self.postMessage.bind(self)
)
