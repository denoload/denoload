import { Options } from "./src/datatypes.ts";
import executors from "./src/executors.ts";
import log from "./src/log.ts";

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
async function loadOptions(moduleURL: URL): Promise<Options> {
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

    return new URL(Deno.args[0], import.meta.url);
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
