import { defaultRpcOptions, RpcClient } from "@negrel/rpc";
import * as globals from "@/private/globals.ts";

const client: RpcClient = globals.createRpcClient();

/**
 * Run untrusted code in an isolated worker.
 */
export function runUntrustedCode(
  { moduleUrl, fnName, fnArgs }: {
    moduleUrl: string;
    fnName: string;
    fnArgs: unknown;
  },
  { workerOptions, timeout = globals.SANDBOX_TIMEOUT }: {
    workerOptions?: WorkerOptions;
    timeout?: number;
  },
) {
  return client.remoteProcedureCall({
    name: "sandbox",
    args: {
      rpc: {
        name: "runUntrustedCode",
        args: { moduleUrl, fnName, fnArgs },
      },
      workerOptions,
      timeout,
    },
  }, { timeout });
}

/**
 * List exported keys and values of a module.
 * Non serializable values are replaced by string representation of their type.
 */
export function listModuleExports(
  moduleUrl: string,
  { workerOptions, timeout = globals.SANDBOX_TIMEOUT }: {
    workerOptions?: WorkerOptions;
    timeout?: number;
  },
) {
  return client.remoteProcedureCall({
    name: "sandbox",
    args: {
      rpc: {
        name: "listModuleExports",
        args: { moduleUrl },
      },
      workerOptions,
      timeout,
    },
  }, { timeout });
}
