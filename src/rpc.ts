import log from "./log.ts";

export interface RPC<A> {
  id: number;
  name: string;
  args?: A;
}

export interface RpcResult<R> {
  id: number;
  result?: R;
  error?: string;
}

export interface RpcOptions {
  timeout: number;
  transfer: Transferable[];
}

const defaultRpcOptions: RpcOptions = {
  timeout: 30000,
  transfer: [],
};

const logger = log.getLogger("k7/main");
let globalMsgId = 0;

export function remoteProcedureCall<A, R>(
  worker: Worker,
  rpc: { name: string; args: A },
  options: Partial<RpcOptions> = {},
): Promise<R | undefined> {
  const { timeout, transfer } = {
    ...options,
    ...defaultRpcOptions,
  };

  const msgId = globalMsgId++;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(`rpc ${msgId} timed out`);
    }, timeout);

    // Response listener
    // deno-lint-ignore prefer-const
    let listener: (_: MessageEvent<RpcResult<R>>) => void;
    listener = (event: MessageEvent<RpcResult<R>>) => {
      // Message is a response to our RPC.
      if (event.data.id !== msgId) {
        return;
      }

      // Clear timeout and event listener..
      clearTimeout(timeoutId);
      worker.removeEventListener("message", listener);

      logger.debug(
        `rpc ${event.data.id} returned ${JSON.stringify(event.data)}`,
      );

      if (event.data.error) {
        reject(event.data.error);
      }

      resolve(event.data.result);
    };
    worker.addEventListener("message", listener);

    logger.debug(`rpc ${msgId} called ${JSON.stringify(rpc)}`);
    worker.postMessage({ id: msgId, ...rpc }, transfer);
  });
}

export function workerProcedureHandler(
  // deno-lint-ignore no-explicit-any
  procedures: Record<string, (...args: any[]) => any>,
  // deno-lint-ignore no-explicit-any
  postMessage: (_: RpcResult<any>) => void,
  // deno-lint-ignore no-explicit-any
): (_: MessageEvent<RPC<any>>) => void {
  const logger = log.getLogger("k7/worker");

  // deno-lint-ignore no-explicit-any
  return async (event: MessageEvent<RPC<any>>): Promise<void> => {
    logger.debug(() =>
      `rpc ${event.data.id} received: ${JSON.stringify(event.data)}`
    );

    try {
      const procedure = procedures[event.data.name];
      if (typeof procedure !== "function") {
        throw new Error(`procedure "${event.data.name}" doesn't exist`);
      }

      const result = await procedure(event.data.args);

      logger.debug(() =>
        `rpc ${event.data.id} done: ${JSON.stringify(result)}`
      );

      postMessage({
        id: event.data.id,
        result,
      });
    } catch (err) {
      logger.error(
        `rpc ${event.data.id} error: ${err.stack}`,
      );

      postMessage({
        id: event.data.id,
        error: err.toString(), // TODO(negrel): serialize before posting message.
      });
    }
  };
}
