export { type RpcClient } from "@negrel/rpc";

import { RpcClient } from "@negrel/rpc";
import { RpcClientConfig } from "@/private/services/rpcclient/config.ts";
import { provideWorkerPool } from "@/private/services/rpcclient/workerpool.ts";
import { Teardown } from "@/private/services/teardown/mod.ts";

/**
 * provideRpcClient is a provider for RpcClient.
 */
export function provideRpcClient(
  config: RpcClientConfig,
  teardown: Teardown,
): RpcClient {
  switch (config.impl) {
    case "workerpool":
      return provideWorkerPool(teardown);
  }
}
