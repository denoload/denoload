import { provideInMem } from "@/private/services/kv/inmem.ts";
import { assertEquals } from "@std/assert";

Deno.test("set and get", async () => {
  const kv = provideInMem();

  const key = ["foo", "bar", "key with space"];
  await kv.set(key, "qux");

  const value = await kv.get(key);
  assertEquals(value, "qux");

  assertEquals(await kv.get([]), undefined);
  assertEquals(await kv.get(["foo"]), undefined);
  assertEquals(await kv.get(["foo", "bar", "key with space", ""]), undefined);
  assertEquals(await kv.get(["foo", "bar", "key with space", " "]), undefined);
  assertEquals(await kv.get(["foo", "bar", "key", "with space"]), undefined);
  assertEquals(await kv.get(["foo", "bar", "", "key with space"]), undefined);
});

Deno.test("list keys", async () => {
  const kv = provideInMem();

  const key = ["foo", "bar", "key with space"];
  await kv.set(key, "qux");

  for (let i = 0; i < 10; i++) {
    const key = ["foo", i.toString()];
    await kv.set(key, i);
  }

  const entries = await kv.list({ prefix: ["foo"] });
  assertEquals(entries, [
    { key: ["foo", "0"], value: 0 },
    { key: ["foo", "1"], value: 1 },
    { key: ["foo", "2"], value: 2 },
    { key: ["foo", "3"], value: 3 },
    { key: ["foo", "4"], value: 4 },
    { key: ["foo", "5"], value: 5 },
    { key: ["foo", "6"], value: 6 },
    { key: ["foo", "7"], value: 7 },
    { key: ["foo", "8"], value: 8 },
    { key: ["foo", "9"], value: 9 },
    { key: ["foo", "bar", "key with space"], value: "qux" },
  ]);
});
