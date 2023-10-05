import log from "./log.ts";
import { RPC, RpcResult, workerProcedureHandler } from "./rpc.ts";

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    onmessage: (_: MessageEvent<RPC<any>>) => void;
    // deno-lint-ignore no-explicit-any
    postMessage: (_: RpcResult<any>) => void;
  }
}

const logger = log.getLogger("k7/worker");

self.onmessage = workerProcedureHandler({
  async iteration(moduleURL: string) {
    const module = await import(moduleURL);
    await module.default();
  },
}, self.postMessage);

logger.info("worker ready");
