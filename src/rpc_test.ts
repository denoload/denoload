import { assertEquals } from "std/assert/assert_equals.ts";
import { remoteProcedureCall } from "./rpc.ts";
import { assertRejects } from "std/assert/assert_rejects.ts";

Deno.test("RPC double()", async () => {
  const worker = new Worker(
    new URL("./test_workers/double.ts", import.meta.url).href,
    { type: "module" },
  );

  const result = await remoteProcedureCall<number, number>(worker, {
    name: "double",
    args: [2],
  });

  assertEquals(result, 4);

  worker.terminate();
});

Deno.test("error is thrown from worker", async () => {
  const worker = new Worker(
    new URL("./test_workers/error.ts", import.meta.url).href,
    { type: "module" },
  );

  await assertRejects(async () => {
    await remoteProcedureCall<undefined, number>(worker, {
      name: "error",
      args: [],
    });
  });

  worker.terminate();
});

Deno.test("non existent procedure", async () => {
  const worker = new Worker(
    new URL("./test_workers/error.ts", import.meta.url).href,
    { type: "module" },
  );

  await assertRejects(async () => {
    await remoteProcedureCall<undefined, number>(worker, {
      name: "non existent",
      args: [],
    });
  });

  worker.terminate();
});
