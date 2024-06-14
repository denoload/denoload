import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import * as sandbox from "@/private/sandbox.ts";

Deno.test("sandboxed script tries to write a file", async () => {
  const moduleUrl = new URL(
    "./sandbox_test_modules/writeFile.ts",
    import.meta.url,
  ).toString();

  await sandbox.runUntrustedCode({
    moduleUrl,
    fnName: "write",
    fnArgs: undefined,
  }, {
    workerOptions: {
      deno: {
        permissions: {
          write: false,
          read: true,
        },
      },
    },
  }).then(
    () => assert(false, "untrusted code didn't throw"),
    (err) => assertStringIncludes(err.toString(), "Requires write access to"),
  );
});

Deno.test("sandbox list exports", async () => {
  const moduleUrl = new URL(
    "./sandbox_test_modules/simpleModule.ts",
    import.meta.url,
  ).toString();

  const result = await sandbox.listModuleExports(moduleUrl, {});

  assertEquals(result, {
    PI: "",
    bool: "",
    default: { PI: "", bool: "", foo: 'function foo() {\n  return "bar";\n}' },
    foo: 'function foo() {\n  return "bar";\n}',
  });
});

Deno.test("sandbox list exports timeout", async () => {
  const moduleUrl = new URL(
    "./sandbox_test_modules/whileTrue.ts",
    import.meta.url,
  ).toString();

  await sandbox.listModuleExports(moduleUrl, { timeout: 500 })
    .then(
      () => assert(false, "sandbox didn't timed out"),
      (err) => assertStringIncludes(err.toString(), "timed out"),
    );
});
