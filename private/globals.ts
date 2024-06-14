import { WorkerRpcClient } from "@negrel/rpc";

const env = Deno.env.toObject();

export const SANDBOX_TIMEOUT = Number.parseInt(
  env["DENOLOAD_SANDBOX_TIMEOUT"] ?? "1000",
);

export const createRpcClient = () => {
  return new WorkerRpcClient(new URL("./worker_script.ts", import.meta.url), {
    type: "module",
  });
};
