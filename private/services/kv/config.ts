/**
 * KvConfig define {@link Kv} configuration.
 */
export type KvConfig = {
  impl: "http";
  port?: number;
} | { impl: "memory" };

/**
 * provideKvConfig is a provider for KvConfig.
 */
export function provideKvConfig(): KvConfig {
  const impl = Deno.env.get("DENOLOAD_KV_IMPL") ?? "http";
  if (impl === "http") {
    const port = Number.parseInt(Deno.env.get("DENOLOAD_KV_HTTP_PORT") ?? "");

    return {
      impl,
      port: Number.isNaN(port) ? undefined : port,
    };
  }

  if (impl !== "memory") throw new Error(`unknown kv impl: ${impl}`);

  return { impl };
}
