import * as log from "std/log/mod.ts";

import executors from "./src/executors.ts";
import { Options, ScenarioOptions } from "./src/datatype.ts";
import ModuleURL from "./src/module_url.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{datetime} {loggerName} [{levelName}] - {msg}",
    }),
  },

  loggers: {
    // k7 main thread logs as opposed to worker threads
    "k7/main": {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger("k7/main");

/**
 * Load a module and its exported options.
 *
 * @param moduleURL - URL of the module to load.
 * @returns Options exported by the module.
 *
 * @throws {@link TypeError}
 * This exception is thrown if the module can't bet imported.
 */
async function loadOptions(moduleURL: ModuleURL): Promise<Options> {
  const module = await import(moduleURL.toString());
  // TODO(@negrel): validate options object before returning it.
  return module.options;
}

(async () => {
  const moduleURL = (() => {
    if (Deno.args.length < 1) {
      logger.error("modules URL missing");
      Deno.exit(1);
    }

    return new ModuleURL(Deno.args[0]);
  })();

  logger.debug(`loading options of module "${moduleURL}"...`);
  const options = await loadOptions(moduleURL);

  for (
    const [scenarioName, scenarioOptions] of Object.entries(options.scenarios)
  ) {
    const executor = new executors[scenarioOptions.executor]();
    await executor.execute(moduleURL, scenarioName, scenarioOptions);
  }

  logger.info("scenarios successfully executed, exiting...");
})();
