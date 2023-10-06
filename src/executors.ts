import { ExecutorKind, ScenarioOptions } from "./datatypes.ts";
import log from "./log.ts";
import { WorkerPool } from "./worker_pool.ts";

const logger = log.getLogger("k7/main");

/**
 * Executor are responsible for coordinating and managing the entire life cycle
 * of a scenario.
 *
 * This is the abstract base class that handle common tasks such as initializing
 * the worker pool.
 */
abstract class Executor {
  protected readonly workerPool: WorkerPool = new WorkerPool();
  protected nbVus = 0;
  protected nbIter = 0;
  private consoleReporterIntervalId: number | null = null;

  /**
   * Execute is the core logic of an executor.
   * It is responsible for executing the given scenario.
   *
   * @param moduleURL - URL of the module to execute.
   * @param scenarioName - Name of the scenario.
   * @param scenarioOptions - Options of the scenario to run.
   */
  abstract execute(
    moduleURL: URL,
    scenarioName: string,
    scenarioOptions: ScenarioOptions,
  ): Promise<void>;

  startConsoleReporter() {
    if (this.consoleReporterIntervalId) {
      return this.consoleReporterIntervalId;
    }

    this.consoleReporterIntervalId = setInterval(() => {
      console.log(
        `${
          new Date().toISOString()
        } - VUs: ${this.nbVus} - iterations: ${this.nbIter}`,
      );
    }, 1000);
  }

  stopConsoleReporter() {
    if (this.consoleReporterIntervalId) {
      clearInterval(this.consoleReporterIntervalId);
    }
  }
}

/**
 * Per VU iteration executor managed a fixed amount of iteration per VU.
 */
export class ExecutorPerVuIteration extends Executor {
  override async execute(
    moduleURL: URL,
    scenarioName: string,
    scenarioOptions: ScenarioOptions,
  ): Promise<void> {
    logger.info(`executing "${scenarioName}" scenario...`);
    this.startConsoleReporter();

    logger.debug("running VUs...");
    const promises = new Array(scenarioOptions.vus);
    for (let vus = 0; vus < scenarioOptions.vus; vus++) {
      promises[vus] = (async () => {
        for (
          let iterations = 0;
          iterations < scenarioOptions.iterations;
          iterations++
        ) {
          await this.workerPool.remoteProcedureCall({
            name: "iteration",
            args: [moduleURL.toString(), { vus, iterations }],
          });
          this.nbIter++;
        }
      })();

      this.nbVus++;
    }
    await Promise.all(promises);
    this.stopConsoleReporter();
    this.workerPool.terminate();
    logger.debug("VUs ran.");

    logger.info(`scenario "${scenarioName}" successfully executed.`);
  }
}

/**
 * Map of executors.
 */
const executors: { [key in ExecutorKind]: new () => Executor } = {
  [ExecutorKind.PerVuIteration]: ExecutorPerVuIteration,
};

export default executors;
