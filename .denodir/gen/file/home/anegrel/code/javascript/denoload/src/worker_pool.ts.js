import log from "./log.ts";
import { numCpus } from "./num_cpus.ts";
import { RpcWorker } from "./rpc.ts";
const logger = log.getLogger("main");
const defaultWorkPoolOptions = {
  workerScript: new URL("./worker_script.ts", import.meta.url),
  minWorker: numCpus(),
  maxWorker: numCpus(),
  maxTasksPerWorker: 128
};
export class WorkerPool {
  workers = [];
  // deno-lint-ignore no-explicit-any
  runningTasks = [];
  taskQueue = [];
  options;
  constructor(options = {}){
    this.options = {
      ...defaultWorkPoolOptions,
      ...options
    };
  }
  async remoteProcedureCall(rpc, options) {
    let worker = this.workers[0];
    let workerIndex = 0;
    // Find a worker.
    if (this.workers.length < this.options.minWorker) {
      [worker, workerIndex] = await this.createWorker();
    } else {
      let workerIndexWithLessTask = -1;
      let workerMinTask = Number.MAX_SAFE_INTEGER;
      for(let i = 0; i < this.workers.length; i++){
        if (this.runningTasks[i].size < workerMinTask) {
          workerMinTask = this.runningTasks[i].size;
          workerIndexWithLessTask = i;
        }
      }
      // All workers are full
      if (workerMinTask >= this.options.maxTasksPerWorker - 1) {
        if (this.workers.length < this.options.maxWorker) {
          [worker, workerIndex] = await this.createWorker();
          this.runningTasks.push(new Set());
        } else {
          // Wait for a new worker to be free.
          logger.debug("worker pool exhausted, waiting for a task to complete");
          [worker, workerIndex] = await new Promise((resolve, reject)=>{
            this.taskQueue.push([
              resolve,
              reject
            ]);
          });
        }
      } else {
        worker = this.workers[workerIndexWithLessTask];
        workerIndex = workerIndexWithLessTask;
      }
    }
    // Do RPC.
    const promise = worker.remoteProcedureCall(rpc, options);
    this.runningTasks[workerIndex].add(promise);
    const result = await promise;
    this.runningTasks[workerIndex].delete(promise);
    // If task in queue, resume it.
    const startNextTask = this.taskQueue.shift();
    if (startNextTask) {
      startNextTask[0]([
        worker,
        workerIndex
      ]);
    }
    return result;
  }
  forEachWorkerRemoteProcedureCall(rpc, options) {
    const promises = [];
    for (const w of this.workers){
      promises.push(w.remoteProcedureCall(rpc, options));
    }
    return Promise.allSettled(promises);
  }
  // Reject task in waiting queue and terminate workers.
  terminate() {
    while(this.taskQueue.length > 0){
      // Reject task in queue.
      this.taskQueue.pop()[1]("worker terminate");
    }
    for (const w of this.workers){
      w.terminate();
    }
  }
  async createWorker() {
    logger.info("spawning a new worker");
    const worker = new RpcWorker(this.options.workerScript, {
      type: "module"
    });
    const index = this.workers.push(worker) - 1;
    this.runningTasks.push(new Set());
    await worker.remoteProcedureCall({
      name: "setupWorker",
      args: [
        index
      ]
    });
    return [
      worker,
      index
    ];
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9hbmVncmVsL2NvZGUvamF2YXNjcmlwdC9kZW5vbG9hZC9zcmMvd29ya2VyX3Bvb2wudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGxvZyBmcm9tIFwiLi9sb2cudHNcIjtcbmltcG9ydCB7IG51bUNwdXMgfSBmcm9tIFwiLi9udW1fY3B1cy50c1wiO1xuaW1wb3J0IHsgUnBjT3B0aW9ucywgUnBjV29ya2VyIH0gZnJvbSBcIi4vcnBjLnRzXCI7XG5cbmNvbnN0IGxvZ2dlciA9IGxvZy5nZXRMb2dnZXIoXCJtYWluXCIpO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtlclBvb2xPcHRpb25zIHtcbiAgd29ya2VyU2NyaXB0OiBVUkw7XG4gIG1pbldvcmtlcjogbnVtYmVyO1xuICBtYXhXb3JrZXI6IG51bWJlcjtcbiAgbWF4VGFza3NQZXJXb3JrZXI6IG51bWJlcjtcbn1cblxuY29uc3QgZGVmYXVsdFdvcmtQb29sT3B0aW9uczogV29ya2VyUG9vbE9wdGlvbnMgPSB7XG4gIHdvcmtlclNjcmlwdDogbmV3IFVSTChcIi4vd29ya2VyX3NjcmlwdC50c1wiLCBpbXBvcnQubWV0YS51cmwpLFxuICBtaW5Xb3JrZXI6IG51bUNwdXMoKSxcbiAgbWF4V29ya2VyOiBudW1DcHVzKCksXG4gIG1heFRhc2tzUGVyV29ya2VyOiAxMjgsXG59O1xuXG5leHBvcnQgY2xhc3MgV29ya2VyUG9vbCB7XG4gIHByaXZhdGUgd29ya2VyczogUnBjV29ya2VyW10gPSBbXTtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcHJpdmF0ZSBydW5uaW5nVGFza3M6IFNldDxQcm9taXNlPGFueT4+W10gPSBbXTtcbiAgcHJpdmF0ZSB0YXNrUXVldWU6IEFycmF5PFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgWyhfOiBbUnBjV29ya2VyLCBudW1iZXJdKSA9PiB2b2lkLCAoXzogYW55KSA9PiB2b2lkXVxuICA+ID0gW107XG5cbiAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBXb3JrZXJQb29sT3B0aW9ucztcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBQYXJ0aWFsPFdvcmtlclBvb2xPcHRpb25zPiA9IHt9KSB7XG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uZGVmYXVsdFdvcmtQb29sT3B0aW9ucyxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHJlbW90ZVByb2NlZHVyZUNhbGw8QSwgUj4oXG4gICAgcnBjOiB7IG5hbWU6IHN0cmluZzsgYXJnczogQVtdIH0sXG4gICAgb3B0aW9ucz86IFBhcnRpYWw8UnBjT3B0aW9ucz4sXG4gICk6IFByb21pc2U8UiB8IHVuZGVmaW5lZD4ge1xuICAgIGxldCB3b3JrZXIgPSB0aGlzLndvcmtlcnNbMF07XG4gICAgbGV0IHdvcmtlckluZGV4ID0gMDtcblxuICAgIC8vIEZpbmQgYSB3b3JrZXIuXG4gICAgaWYgKHRoaXMud29ya2Vycy5sZW5ndGggPCB0aGlzLm9wdGlvbnMubWluV29ya2VyKSB7XG4gICAgICBbd29ya2VyLCB3b3JrZXJJbmRleF0gPSBhd2FpdCB0aGlzLmNyZWF0ZVdvcmtlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgd29ya2VySW5kZXhXaXRoTGVzc1Rhc2sgPSAtMTtcbiAgICAgIGxldCB3b3JrZXJNaW5UYXNrID0gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud29ya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nVGFza3NbaV0uc2l6ZSA8IHdvcmtlck1pblRhc2spIHtcbiAgICAgICAgICB3b3JrZXJNaW5UYXNrID0gdGhpcy5ydW5uaW5nVGFza3NbaV0uc2l6ZTtcbiAgICAgICAgICB3b3JrZXJJbmRleFdpdGhMZXNzVGFzayA9IGk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWxsIHdvcmtlcnMgYXJlIGZ1bGxcbiAgICAgIGlmICh3b3JrZXJNaW5UYXNrID49IHRoaXMub3B0aW9ucy5tYXhUYXNrc1BlcldvcmtlciAtIDEpIHtcbiAgICAgICAgaWYgKHRoaXMud29ya2Vycy5sZW5ndGggPCB0aGlzLm9wdGlvbnMubWF4V29ya2VyKSB7XG4gICAgICAgICAgW3dvcmtlciwgd29ya2VySW5kZXhdID0gYXdhaXQgdGhpcy5jcmVhdGVXb3JrZXIoKTtcbiAgICAgICAgICB0aGlzLnJ1bm5pbmdUYXNrcy5wdXNoKG5ldyBTZXQoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gV2FpdCBmb3IgYSBuZXcgd29ya2VyIHRvIGJlIGZyZWUuXG4gICAgICAgICAgbG9nZ2VyLmRlYnVnKFwid29ya2VyIHBvb2wgZXhoYXVzdGVkLCB3YWl0aW5nIGZvciBhIHRhc2sgdG8gY29tcGxldGVcIik7XG4gICAgICAgICAgW3dvcmtlciwgd29ya2VySW5kZXhdID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50YXNrUXVldWUucHVzaChbcmVzb2x2ZSwgcmVqZWN0XSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmtlciA9IHRoaXMud29ya2Vyc1t3b3JrZXJJbmRleFdpdGhMZXNzVGFza107XG4gICAgICAgIHdvcmtlckluZGV4ID0gd29ya2VySW5kZXhXaXRoTGVzc1Rhc2s7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRG8gUlBDLlxuICAgIGNvbnN0IHByb21pc2UgPSB3b3JrZXIucmVtb3RlUHJvY2VkdXJlQ2FsbDxBLCBSPihcbiAgICAgIHJwYyxcbiAgICAgIG9wdGlvbnMsXG4gICAgKTtcbiAgICB0aGlzLnJ1bm5pbmdUYXNrc1t3b3JrZXJJbmRleF0uYWRkKHByb21pc2UpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHByb21pc2U7XG4gICAgdGhpcy5ydW5uaW5nVGFza3Nbd29ya2VySW5kZXhdLmRlbGV0ZShwcm9taXNlKTtcblxuICAgIC8vIElmIHRhc2sgaW4gcXVldWUsIHJlc3VtZSBpdC5cbiAgICBjb25zdCBzdGFydE5leHRUYXNrID0gdGhpcy50YXNrUXVldWUuc2hpZnQoKTtcbiAgICBpZiAoc3RhcnROZXh0VGFzaykge1xuICAgICAgc3RhcnROZXh0VGFza1swXShbd29ya2VyLCB3b3JrZXJJbmRleF0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmb3JFYWNoV29ya2VyUmVtb3RlUHJvY2VkdXJlQ2FsbDxBLCBSPihcbiAgICBycGM6IHsgbmFtZTogc3RyaW5nOyBhcmdzOiBBW10gfSxcbiAgICBvcHRpb25zPzogUGFydGlhbDxScGNPcHRpb25zPixcbiAgKTogUHJvbWlzZTxBcnJheTxQcm9taXNlU2V0dGxlZFJlc3VsdDxBd2FpdGVkPFI+IHwgdW5kZWZpbmVkPj4+IHtcbiAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgdyBvZiB0aGlzLndvcmtlcnMpIHtcbiAgICAgIHByb21pc2VzLnB1c2gody5yZW1vdGVQcm9jZWR1cmVDYWxsPEEsIFI+KHJwYywgb3B0aW9ucykpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLmFsbFNldHRsZWQocHJvbWlzZXMpO1xuICB9XG5cbiAgLy8gUmVqZWN0IHRhc2sgaW4gd2FpdGluZyBxdWV1ZSBhbmQgdGVybWluYXRlIHdvcmtlcnMuXG4gIHRlcm1pbmF0ZSgpIHtcbiAgICB3aGlsZSAodGhpcy50YXNrUXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgLy8gUmVqZWN0IHRhc2sgaW4gcXVldWUuXG4gICAgICB0aGlzLnRhc2tRdWV1ZS5wb3AoKSFbMV0oXCJ3b3JrZXIgdGVybWluYXRlXCIpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdyBvZiB0aGlzLndvcmtlcnMpIHtcbiAgICAgIHcudGVybWluYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVXb3JrZXIoKTogUHJvbWlzZTxbUnBjV29ya2VyLCBudW1iZXJdPiB7XG4gICAgbG9nZ2VyLmluZm8oXCJzcGF3bmluZyBhIG5ldyB3b3JrZXJcIik7XG4gICAgY29uc3Qgd29ya2VyID0gbmV3IFJwY1dvcmtlcihcbiAgICAgIHRoaXMub3B0aW9ucy53b3JrZXJTY3JpcHQsXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwibW9kdWxlXCIsXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBjb25zdCBpbmRleCA9IHRoaXMud29ya2Vycy5wdXNoKHdvcmtlcikgLSAxO1xuICAgIHRoaXMucnVubmluZ1Rhc2tzLnB1c2gobmV3IFNldCgpKTtcblxuICAgIGF3YWl0IHdvcmtlci5yZW1vdGVQcm9jZWR1cmVDYWxsKHtcbiAgICAgIG5hbWU6IFwic2V0dXBXb3JrZXJcIixcbiAgICAgIGFyZ3M6IFtpbmRleF0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gW3dvcmtlciwgaW5kZXhdO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTLFdBQVc7QUFDM0IsU0FBUyxPQUFPLFFBQVEsZ0JBQWdCO0FBQ3hDLFNBQXFCLFNBQVMsUUFBUSxXQUFXO0FBRWpELE1BQU0sU0FBUyxJQUFJLFNBQVMsQ0FBQztBQVM3QixNQUFNLHlCQUE0QztFQUNoRCxjQUFjLElBQUksSUFBSSxzQkFBc0IsWUFBWSxHQUFHO0VBQzNELFdBQVc7RUFDWCxXQUFXO0VBQ1gsbUJBQW1CO0FBQ3JCO0FBRUEsT0FBTyxNQUFNO0VBQ0gsVUFBdUIsRUFBRSxDQUFDO0VBQ2xDLG1DQUFtQztFQUMzQixlQUFvQyxFQUFFLENBQUM7RUFDdkMsWUFHSixFQUFFLENBQUM7RUFFVSxRQUEyQjtFQUU1QyxZQUFZLFVBQXNDLENBQUMsQ0FBQyxDQUFFO0lBQ3BELElBQUksQ0FBQyxPQUFPLEdBQUc7TUFDYixHQUFHLHNCQUFzQjtNQUN6QixHQUFHLE9BQU87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