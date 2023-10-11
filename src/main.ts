import * as path from "std/path/mod.ts";

import { Options } from "./datatypes.ts";
import executors from "./executors.ts";
import log from "./log.ts";

const logger = log.getLogger("main");

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

function printAsciiArt() {
  const dino = [
    "                __  ",
    "               / _) ",
    "      _.----._/ /   ",
    "     /         /    ",
    "  __/ (  | (  |     ",
    " /__.-'|_|--|_|     ",
  ];
  const denoload = [
    " ___                   _                _ ",
    "|   \\  ___  _ _   ___ | | ___  __ _  __| |",
    "| |) |/ -_)| ' \\ / _ \\| |/ _ \\/ _` |/ _` |",
    "|___/ \\___||_||_|\\___/|_|\\___/\\__/_|\\__/_|",
  ];

  for (let i = 0; i < 6; i++) {
    let str = dino[i];
    if (i >= 1 && i < 5) {
      str += denoload[i - 1];
    }
    console.log(str);
  }
  console.log();
}

Deno.addSignalListener("SIGINT", () => {
  logger.warning("denoload received SIGINT...");
  Deno.exit(1);
});

(async () => {
  printAsciiArt();
  const moduleURL = (() => {
    if (Deno.args.length < 1) {
      logger.error("modules URL missing");
      Deno.exit(1);
    }

    return new URL(path.join("file://", Deno.cwd(), Deno.args[0]));
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
