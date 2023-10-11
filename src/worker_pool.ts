import log from "./log.ts";
import { numCpus } from "./num_cpus.ts";
import { RpcOptions, RpcWorker } from "./rpc.ts";

const logger = log.getLogger("main");

export interface WorkerPoolOptions {
  workerScript: URL;
  minWorker: number;
  maxWorker: number;
  maxTasksPerWorker: number;
}

const defaultWorkPoolOptions: WorkerPoolOptions = {
  workerScript: new URL("./worker_script.ts", import.meta.url),
  minWorker: numCpus(),
  // Until Shadow Realms are implemented in Deno, VUs are isolated in different workers.
  // https://github.com/denoland/deno/issues/13239
  maxWorker: Number.MAX_SAFE_INTEGER,
  maxTasksPerWorker: 1,
};

export class WorkerPool {
  private workers: RpcWorker[] = [];
  // deno-lint-ignore no-explicit-any
  private runningTasks: Set<Promise<any>>[] = [];
  private taskQueue: Array<
    // deno-lint-ignore no-explicit-any
    [(_: [RpcWorker, number]) => void, (_: any) => void]
  > = [];

  private readonly options: WorkerPoolOptions;

  constructor(options: Partial<WorkerPoolOptions> = {}) {
    this.options = {
      ...defaultWorkPoolOptions,
      ...options,
    };
  }

  async remoteProcedureCall<A, R>(
    rpc: { name: string; args: A[] },
    options?: Partial<RpcOptions>,
  ): Promise<R | undefined> {
    let worker = this.workers[0];
    let workerIndex = 0;

    // Find a worker.
    if (this.workers.length < this.options.minWorker) {
      [worker, workerIndex] =  this.createWorker();
    } else {
      let workerIndexWithLessTask = -1;
      let workerMinTask = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < this.workers.length; i++) {
        if (this.runningTasks[i].size < workerMinTask) {
          workerMinTask = this.runningTasks[i].size;
          workerIndexWithLessTask = i;
        }
      }

      // All workers are full
      if (workerMinTask >= this.options.maxTasksPerWorker - 1) {
        if (this.workers.length < this.options.maxWorker) {
          [worker, workerIndex] =  this.createWorker();
          this.runningTasks.push(new Set());
        } else {
          // Wait for a new worker to be free.
          logger.debug("worker pool exhausted, waiting for a task to complete");
          [worker, workerIndex] = await new Promise((resolve, reject) => {
            this.taskQueue.push([resolve, reject]);
          });
        }
      } else {
        worker = this.workers[workerIndexWithLessTask];
        workerIndex = workerIndexWithLessTask;
      }
    }

    // Do RPC.
    const promise = worker.remoteProcedureCall<A, R>(
      rpc,
      options,
    );
    this.runningTasks[workerIndex].add(promise);
    const result = await promise;
    this.runningTasks[workerIndex].delete(promise);

    // If task in queue, resume it.
    const startNextTask = this.taskQueue.shift();
    if (startNextTask) {
      startNextTask[0]([worker, workerIndex]);
    }

    return result;
  }

  forEachWorkerRemoteProcedureCall<A, R>(
    rpc: { name: string; args: A[] },
    options?: Partial<RpcOptions>,
  ): Promise<Array<PromiseSettledResult<Awaited<R> | undefined>>> {
    const promises = [];
    for (const w of this.workers) {
      promises.push(w.remoteProcedureCall<A, R>(rpc, options));
    }

    return Promise.allSettled(promises);
  }

  // Reject task in waiting queue and terminate workers.
  terminate() {
    while (this.taskQueue.length > 0) {
      // Reject task in queue.
      this.taskQueue.pop()![1]("worker terminate");
    }

    for (const w of this.workers) {
      w.terminate();
    }
  }

  private createWorker(): [RpcWorker, number] {
    logger.info("spawning a new worker");
    const worker = new RpcWorker(
      this.options.workerScript,
      {
        type: "module",
      },
    );

    const index = this.workers.push(worker) - 1;
    this.runningTasks.push(new Set());

    worker.remoteProcedureCall({
      name: "setupWorker",
      args: [index],
    });

    return [worker, index];
  }
}
