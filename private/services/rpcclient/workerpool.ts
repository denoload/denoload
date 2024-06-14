import { RpcClient } from "@negrel/rpc";
import {
  minMaxWorker,
  WorkerPool,
  workerRpcClientFactory,
} from "@negrel/workerpool";
import { numCpus } from "@/private/num_cpus.ts";
import { Teardown } from "@/private/services/teardown/mod.ts";

/**
 * provideWorkerPool is a provider for a worker pool based RpcClient.
 */
export function provideWorkerPool(teardown: Teardown): RpcClient {
  const pool = new WorkerPool({
    workerFactory: workerRpcClientFactory(
      new URL("./worker_script.ts", import.meta.url),
      { type: "module" },
    ),
    algo: minMaxWorker({
      maxWorker: numCpus(),
      tasksPerWorker: {
        min: 0,
        max: 1000,
      },
    }),
  });

  teardown.registerTeardownProcedure(() => {
    pool.terminate();
  });

  return pool;
}
