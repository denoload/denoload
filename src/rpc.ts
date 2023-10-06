import log from "./log.ts";

export interface RPC<A> {
  id: number;
  name: string;
  args: A[];
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

// deno-lint-ignore no-explicit-any
type ResponseHandler = (_: RpcResult<any>) => void;

export class RpcWorker {
  private readonly worker: Worker;
  private readonly responseHandlers: Map<number, ResponseHandler> = new Map();

  constructor(specifier: string | URL, options?: WorkerOptions | undefined) {
    this.worker = new Worker(specifier, options);
    this.worker.onmessage = this.onResponse.bind(this);
  }

  terminate() {
    this.worker.terminate();
  }

  private onResponse<R>(event: MessageEvent<RpcResult<R>>) {
    const responseId = event.data.id;
    const responseHandler = this.responseHandlers.get(responseId);

    if (!responseHandler) {
      throw new Error(
        `received unexpected response for rpc ${responseId}, no handler registered`,
      );
    }

    responseHandler(event.data);
  }

  remoteProcedureCall<A, R>(
    rpc: { name: string; args: A[] },
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

      this.addResponseHandler(msgId, (data: RpcResult<R>) => {
        // Clear timeout and response handler.
        clearTimeout(timeoutId);
        this.removeResponseHandler(msgId);

        logger.debug(
          `rpc ${data.id} returned ${JSON.stringify(data)}`,
        );

        if (data.error) {
          reject(data.error);
        }

        resolve(data.result);
      });

      logger.debug(`rpc ${msgId} called ${JSON.stringify(rpc)}`);
      this.worker.postMessage({ id: msgId, ...rpc }, transfer);
    });
  }

  private addResponseHandler(id: number, handler: ResponseHandler) {
    this.responseHandlers.set(id, handler);
  }

  private removeResponseHandler(id: number) {
    this.responseHandlers.delete(id);
  }
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

      const result = await procedure(...event.data.args);

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
