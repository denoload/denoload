import { assertEquals } from "std/assert/assert_equals.ts";
import { assertRejects } from "std/assert/assert_rejects.ts";
import { RpcWorker } from "./rpc.ts";

Deno.test("RPC double()", async () => {
  const worker = new RpcWorker(
    new URL("./test_workers/double.ts", import.meta.url).href,
    { type: "module" },
  );

  const result = await worker.remoteProcedureCall<number, number>({
    name: "double",
    args: [2],
  });

  assertEquals(result, 4);

  worker.terminate();
});

Deno.test("error is thrown from worker", async () => {
  const worker = new RpcWorker(
    new URL("./test_workers/error.ts", import.meta.url).href,
    { type: "module" },
  );

  await assertRejects(async () => {
    await worker.remoteProcedureCall<undefined, number>({
      name: "error",
      args: [],
    });
  });

  worker.terminate();
});

Deno.test("non existent procedure", async () => {
  const worker = new RpcWorker(
    new URL("./test_workers/error.ts", import.meta.url).href,
    { type: "module" },
  );

  await assertRejects(async () => {
    await worker.remoteProcedureCall<undefined, number>({
      name: "non existent",
      args: [],
    });
  });

  worker.terminate();
});
