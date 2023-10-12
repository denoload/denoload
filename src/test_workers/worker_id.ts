import { type RPC, type RpcResult, workerProcedureHandler } from '../rpc.ts'

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    onmessage: (_: MessageEvent<RPC<any>>) => void
    // deno-lint-ignore no-explicit-any
    postMessage: (_: RpcResult<any>) => void
  }
}

let workerId: number | null = null

self.onmessage = workerProcedureHandler({
  setupWorker (wId: number) {
    workerId = wId
  },
  async sleep (ms: number): Promise<void> {
    await new Promise((resolve, _reject) => {
      setTimeout(resolve, ms)
    })
  },
  async sleepAndReturnWorkerIdAndArgs (
    // deno-lint-ignore no-explicit-any
    ...args: any[]
    // deno-lint-ignore no-explicit-any
  ): Promise<{ workerId: number, args: any[] }> {
    return await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (workerId == null) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('worker id not defined'); return
        }

        resolve({ workerId, args })
      }, 1000)
    })
  }
}, self.postMessage)
