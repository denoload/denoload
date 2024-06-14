import { RpcClient } from "@/private/services/rpcclient/mod.ts";
import { SandboxConfig } from "@/private/services/sandbox/config.ts";

/**
 * Sandbox define an isolated, secure JS/TS execution environment.
 */
export interface Sandbox {
  runUntrustedCode(
    moduleUrl: string,
    fnName: string,
    fnArgs: unknown,
  ): Promise<void>;

  listModuleExports(
    moduleUrl: string,
  ): Promise<unknown>;
}

/**
 * provideSandbox is a provider for a Sandbox.
 */
export function provideSandbox(
  config: SandboxConfig,
  client: RpcClient,
): Sandbox {
  return {
    runUntrustedCode(
      moduleUrl: string,
      fnName: string,
      fnArgs: unknown,
    ) {
      return client.remoteProcedureCall({
        name: "sandbox",
        args: {
          rpc: {
            name: "runUntrustedCode",
            args: { moduleUrl, fnName, fnArgs },
          },
          workerOptions: config.workerOptions,
          timeout: config.timeout,
        },
      }, { timeout: config.timeout });
    },
    listModuleExports(
      moduleUrl: string,
    ): Promise<unknown> {
      return client.remoteProcedureCall({
        name: "sandbox",
        args: {
          rpc: {
            name: "listModuleExports",
            args: { moduleUrl },
          },
          workerOptions: config.workerOptions,
          timeout: config.timeout,
        },
      }, { timeout: config.timeout });
    },
  };
}
