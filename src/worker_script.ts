import * as log from "std/log/mod.ts";
import { RPC, RpcResult, workerProcedureHandler } from "./rpc.ts";
import * as vm from "./vu_global_this.js";
import { PerformanceMetric } from "./metrics.ts";

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

    vm.setup();
    logger = log.getLogger("worker");
    logger.info("worker ready");
  },
  async iteration(moduleURL: string) {
    const module = await import(moduleURL);
    await module.default();
  },
  collectPerformanceMetrics() {
    const result: Record<string, PerformanceMetric> = {
      fetch: computePerfMetric("fetch"),
    };
    performance.clearMeasures("fetch");

    return result;
  },
}, self.postMessage);

function computePerfMetric(name: string): PerformanceMetric {
  const result = {
    datapoints: 0,
    min: Number.MAX_SAFE_INTEGER,
    avg: 0,
    max: 0,
  };
  const entries = performance.getEntriesByName(name);
  if (entries.length === 0) {
    result.min = 0;
    return result;
  }

  let sum = 0;
  for (const entry of entries) {
    if (entry.duration < result.min) {
      result.min = entry.duration;
    }
    if (entry.duration > result.max) {
      result.max = entry.duration;
    }
    sum += entry.duration;
  }
  result.datapoints = entries.length;
  result.avg = sum / entries.length;

  return result;
}
