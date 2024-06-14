import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { provideSandbox } from "@/private/services/sandbox/mod.ts";
import { provideRpcClient } from "@/private/services/rpcclient/mod.ts";
import { provideTeardown } from "@/private/services/teardown/mod.ts";

Deno.test("sandboxed script tries to write a file", async () => {
  const moduleUrl = new URL(
    "./test_modules/writeFile.ts",
    import.meta.url,
  ).toString();

  const teardown = provideTeardown();
  const client = provideRpcClient({ impl: "workerpool" }, teardown);
  const sandbox = provideSandbox({
    timeout: 10_000,
    workerOptions: {
      deno: {
        permissions: {
          write: false,
          read: true,
        },
      },
    },
  }, client);

  await sandbox.runUntrustedCode(moduleUrl, "write", undefined)
    .then(
      () => assert(false, "untrusted code didn't throw"),
      (err) => assertStringIncludes(err.toString(), "Requires write access to"),
    );

  await teardown.teardown();
});

Deno.test("sandbox list exports", async () => {
  const moduleUrl = new URL(
    "./test_modules/simpleModule.ts",
    import.meta.url,
  ).toString();

  const teardown = provideTeardown();
  const client = provideRpcClient({ impl: "workerpool" }, teardown);
  const sandbox = provideSandbox({
    timeout: 10_000,
    workerOptions: {
      deno: {
        permissions: {
          write: false,
          read: true,
        },
      },
    },
  }, client);

  const result = await sandbox.listModuleExports(moduleUrl);

  assertEquals(result, {
    PI: 3.141592653589793,
    bool: true,
    default: {
      PI: 3.141592653589793,
      bool: true,
      foo: 'function foo() {\n  return "bar";\n}',
    },
    foo: 'function foo() {\n  return "bar";\n}',
  });

  await teardown.teardown();
});

Deno.test("sandbox list exports timeout", async () => {
  const moduleUrl = new URL(
    "./test_modules/whileTrue.ts",
    import.meta.url,
  ).toString();

  const teardown = provideTeardown();
  const client = provideRpcClient({ impl: "workerpool" }, teardown);
  const sandbox = provideSandbox({
    timeout: 500,
    workerOptions: {
      deno: {
        permissions: {
          write: false,
          read: true,
        },
      },
    },
  }, client);

  await sandbox.listModuleExports(moduleUrl)
    .then(
      () => assert(false, "sandbox didn't timed out"),
      (err) => assertStringIncludes(err.toString(), "timed out"),
    );

  await teardown.teardown();
});
