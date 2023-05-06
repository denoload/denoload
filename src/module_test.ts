import { assertEquals } from "std/testing/asserts.ts";
import { ModuleURL } from "./module_url.ts";

const cwd = Deno.cwd();

Deno.test("file:// URL to existing file is valid", () => {
  const expectedURL = `file://${cwd}/module_test.ts`;
  const moduleURL = new ModuleURL(expectedURL);

  assertEquals(moduleURL.toString(), expectedURL);
});

Deno.test("file:// URL to inexistent file is valid", () => {
  const expectedURL = `file:///proc/inexistent_file.ts`;
  const moduleURL = new ModuleURL(expectedURL);

  assertEquals(moduleURL.toString(), expectedURL);
});

Deno.test("relative path to existing file is valid", () => {
  const expectedURL = `./module_test.ts`;
  const moduleURL = new ModuleURL(expectedURL);

  assertEquals(moduleURL.toString(), `file://${cwd}/module_test.ts`);
});

Deno.test("relative path to inexistent file is invalid", () => {
  new ModuleURL(`./inexistent_file.ts`);
});

Deno.test("absolute path to existing file is valid", () => {
  const expectedURL = `./module_test.ts`;
  const moduleURL = new ModuleURL(expectedURL);

  assertEquals(moduleURL.toString(), `file://${cwd}/module_test.ts`);
});

Deno.test("absolute path to inexistent file is valid", () => {
  const expectedURL = `${cwd}/module_test.ts`;
  const moduleURL = new ModuleURL(expectedURL);

  assertEquals(moduleURL.toString(), `file://${cwd}/module_test.ts`);
});
