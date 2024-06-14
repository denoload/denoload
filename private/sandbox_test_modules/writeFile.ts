export async function write() {
  await Deno.writeTextFile(import.meta.url, "");
}
