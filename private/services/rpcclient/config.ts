/**
 * RpcClientConfig define configuration of RpcClient.
 */
export type RpcClientConfig = { impl: "workerpool" };

/**
 * provideRpcClientConfig is a provider for RpcClientConfig.
 */
export function provideRpcClientConfig(): RpcClientConfig {
  const impl = Deno.env.get("DENOLOAD_RPC_CLIENT_IMPL") ?? "workerpool";
  if (impl !== "workerpool") {
    throw new Error(`unknown RPC client implementation: ${impl}`);
  }

  return { impl: "workerpool" };
}
