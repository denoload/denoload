import { type RPC, type RpcResult, workerProcedureHandler } from '../rpc.ts'

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    onmessage: (_: MessageEvent<RPC<any>>) => void
    // deno-lint-ignore no-explicit-any
    postMessage: (_: RpcResult<any>) => void
  }
}

self.onmessage = workerProcedureHandler({
  error () {
    throw new Error('runtime error from worker')
  }
}, self.postMessage)
