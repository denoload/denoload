import { RPC, RpcResult, workerProcedureHandler } from "../rpc.ts";

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    onmessage: (_: MessageEvent<RPC<any>>) => void;
    // deno-lint-ignore no-explicit-any
    postMessage: (_: RpcResult<any>) => void;
  }
}

self.onmessage = workerProcedureHandler({
  double(nb: number): number {
    return nb * 2;
  },
}, self.postMessage);
