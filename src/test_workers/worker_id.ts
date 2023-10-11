import { RPC, RpcResult, workerProcedureHandler } from "../rpc.ts";

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    onmessage: (_: MessageEvent<RPC<any>>) => void;
    // deno-lint-ignore no-explicit-any
    postMessage: (_: RpcResult<any>) => void;
  }
}

let workerId: number | null = null;

self.onmessage = workerProcedureHandler({
  setupWorker(wId: number) {
    workerId = wId;
  },
  sleep(ms: number): Promise<void> {
    return new Promise((resolve, _reject) => {
      setTimeout(resolve, ms);
    });
  },
  // deno-lint-ignore no-explicit-any
  sleepAndReturnWorkerIdAndArgs(
    ...args: any[]
  ): Promise<{ workerId: number; args: any[] }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (workerId == null) {
          return reject("worker id not defined");
        }

        resolve({ workerId, args });
      }, 1000);
    });
  },
}, self.postMessage);
