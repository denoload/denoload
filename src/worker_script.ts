import * as log from "std/log/mod.ts";
import { RPC, RpcResult, workerProcedureHandler } from "./rpc.ts";

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    onmessage: (_: MessageEvent<RPC<any>>) => void;
    // deno-lint-ignore no-explicit-any
    postMessage: (_: RpcResult<any>) => void;
  }
}

let logger = log.getLogger();

self.onmessage = workerProcedureHandler({
  // NOTE: setupWorker MUST NOT be async.
  setupWorker(workerId: number) {
    log.setup({
      handlers: {
        worker: new log.handlers.ConsoleHandler("NOTSET", {
          formatter: (logRecord: log.LogRecord) => {
            const args = logRecord.args
              // deno-lint-ignore no-explicit-any
              .map((arg: any) => arg.toString())
              .join(" ");

            return `${logRecord.datetime.toISOString()} [${logRecord.levelName}] [${logRecord.loggerName}/${workerId}] - ${logRecord.msg} ${args}`;
          },
        }),
      },
      loggers: {
        "worker": {
          handlers: ["worker"],
        },
      },
    });

    logger = log.getLogger("worker");
    logger.info("worker ready");
  },
  async iteration(moduleURL: string) {
    const module = await import(moduleURL);
    await module.default();
  },
}, self.postMessage);
