import { workerMessageHandler, WorkerRpcClient } from "@negrel/rpc";

declare const self: Worker;

self.onmessage = workerMessageHandler(
  {
    async sandbox(
      { rpc, options, workerOptions }: {
        rpc: { name: string; args: unknown };
        options?: { timeout: number };
        workerOptions?: WorkerOptions;
      },
    ) {
      const client = new WorkerRpcClient(
        new URL("./sandbox_worker_script.ts", import.meta.url),
        { ...workerOptions, type: "module" },
      );

      const result = await client.remoteProcedureCall(rpc, options)
        .finally(() => client.terminate());

      client.terminate();

      return result;
    },
  },
);
