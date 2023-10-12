import * as log from "./log.ts";

import { workerProcedureHandler } from "./rpc.ts";

declare const self: Worker;

let logger = log.getLogger("worker/-1");

self.onmessage = workerProcedureHandler({
  // NOTE: setupWorker MUST NOT be async.
  setupWorker(workerId: number) {
		logger = log.getLogger(`worker/${workerId}`)
    logger.info("worker ready");
  },
  async iterations(moduleURL: string, nbIter: number, vus: number) {
    const module = await import(moduleURL);

    for (let i = 0; i < nbIter; i++) {
      try {
        await module.default(vus, i);
      } catch (err) {
        console.error(err);
      }
    }
  },
  async cleanupWorker() {
  },
}, self.postMessage);
