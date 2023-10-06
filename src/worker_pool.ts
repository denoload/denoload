import log from "./log.ts";
import { remoteProcedureCall, RpcOptions } from "./rpc.ts";

const logger = log.getLogger("k7/main");

export interface WorkerPoolOptions {
  minWorker: number;
  maxWorker: number;
  maxTasksPerWorker: number;
}

const defaultWorkPoolOptions: WorkerPoolOptions = {
  minWorker: 4,
  maxWorker: 8,
  maxTasksPerWorker: 100,
};

export class WorkerPool {
  private workers: Worker[] = [];
  // deno-lint-ignore no-explicit-any
  private runningTasks: Set<Promise<any>>[] = [];
  // deno-lint-ignore no-explicit-any
  private taskQueue: Array<[(_: [Worker, number]) => void, (_: any) => void]> =
    [];

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
      worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });

      workerIndex = this.workers.push(worker) - 1;
      this.runningTasks.push(new Set());
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
      if (workerMinTask >= this.options.maxTasksPerWorker) {
        // Wait for a new worker to be free.
        logger.debug("worker pool exhausted, waiting for a task to complete");
        [worker, workerIndex] = await new Promise((resolve, reject) => {
          this.taskQueue.push([resolve, reject]);
        });
      } else {
        worker = this.workers[workerIndexWithLessTask];
        workerIndex = workerIndexWithLessTask;
      }
    }

    // Do RPC.
    const promise = remoteProcedureCall<A, R>(
      worker,
      rpc,
      options,
    );
    this.runningTasks[workerIndex].add(promise);
    const result = await promise;
    this.runningTasks[workerIndex].delete(promise);

    // If task in queue, resume it.
    const startNextTask = this.taskQueue.pop();
    if (startNextTask) {
      startNextTask[0]([worker, workerIndex]);
    }

    return result;
  }

  terminate() {
    while (this.taskQueue.length > 0) {
      this.taskQueue.pop()![1]("worker terminate");
    }

    for (const w of this.workers) {
      console.log("terminating...");
      w.terminate();
      console.log("terminated");
    }
  }
}
