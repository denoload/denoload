import { RpcClient } from "@negrel/rpc";
import {
  minMaxWorker,
  WorkerPool,
  workerRpcClientFactory,
} from "@negrel/workerpool";
import { numCpus } from "@/private/num_cpus.ts";

/**
 * provideWorkerPool is a provider for a worker pool based RpcClient.
 */
export function provideWorkerPool(): RpcClient {
  return new WorkerPool({
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
}
