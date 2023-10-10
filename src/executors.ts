import { ExecutorKind, ScenarioOptions } from "./datatypes.ts";
import log from "./log.ts";
import { aggregateMetrics, PerformanceMetric } from "./metrics.ts";
import { WorkerPool } from "./worker_pool.ts";

const logger = log.getLogger("main");
const encoder = new TextEncoder();

interface ScenarioProgress {
  scenarioName: string;
  currentVus: number;
  maxVus: number;
  currentIterations: number;
  maxIterations: number;
  percentage: number;
  extraInfos: string;
}

/**
 * Executor are responsible for coordinating and managing the entire life cycle
 * of a scenario.
 *
 * This is the abstract base class that handle common tasks such as initializing
 * the worker pool.
 */
abstract class Executor {
  protected readonly workerPool: WorkerPool = new WorkerPool();
  private consoleReporterIntervalId: number | null = null;
  private consoleReporterCb = () => {};

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

  abstract scenarioProgress(): ScenarioProgress;

  startConsoleReporter() {
    if (this.consoleReporterIntervalId) {
      return this.consoleReporterIntervalId;
    }

    const startTime = new Date();
    const progressBarEmptyChar =
      "--------------------------------------------------";
    const progressBarFullChar =
      "==================================================";

    this.consoleReporterIntervalId = setInterval(() => {
      const progress = this.scenarioProgress();
      const duration = new Date().getTime() - startTime.getTime();
      const percentage = Math.floor(progress.percentage);

      // Deno.stdout.write(encoder.encode("\x1b[2A\x1b[K"));
      Deno.stdout.write(
        encoder.encode(
          `running (${
            duration / 1000
          }s), ${progress.currentVus}/${progress.maxVus}, ${progress.currentIterations}/${progress.maxIterations}\n`,
        ),
      );
      Deno.stdout.write(
        encoder.encode(
          `${progress.scenarioName} [${
            progressBarFullChar.slice(0, Math.floor(percentage / 2))
          }${
            progressBarEmptyChar.slice(0, 50 - Math.floor(percentage / 2))
          }]\n`,
        ),
      );

      this.consoleReporterCb();
    }, 1000);
  }

  stopConsoleReporter(): Promise<void> | void {
    if (this.consoleReporterIntervalId) {
      return new Promise((resolve) => {
        this.consoleReporterCb = () => {
          clearInterval(this.consoleReporterIntervalId!);
          resolve(undefined);
        };
      });
    }
  }

  async collectPerformanceMetrics() {
    // Collect metrics.
    const metrics = await this.workerPool
      .forEachWorkerRemoteProcedureCall<
        never,
        Record<string, PerformanceMetric>
      >({
        name: "collectPerformanceMetrics",
        args: [],
      });

    const result: Record<string, PerformanceMetric>[] = [];
    for (const m of metrics) {
      if (m.status === "rejected") {
        logger.error(
          "one or more workers metrics were lost, result may be innacurate",
        );
      } else {
        result.push(m.value!);
      }
    }

    return aggregateMetrics(...result);
  }
}

/**
 * Per VU iteration executor managed a fixed amount of iteration per VU.
 */
export class ExecutorPerVuIteration extends Executor {
  private scenarioName = "";
  private currentVus = 0;
  private maxVus = 0;
  private currentIterations = 0;
  private maxIterations = 0;

  override async execute(
    moduleURL: URL,
    scenarioName: string,
    scenarioOptions: ScenarioOptions,
  ): Promise<void> {
    logger.info(`executing "${scenarioName}" scenario...`);
    this.maxVus = scenarioOptions.vus;
    this.maxIterations = scenarioOptions.iterations * this.maxVus;
    this.scenarioName = scenarioName;

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
          this.currentIterations++;
        }
      })();

      this.currentVus++;
    }
    // Wait end of all iterations.
    await Promise.all(promises);

    // Collect metrics.
    const metrics = await this.collectPerformanceMetrics();

    // Clean up.
    this.workerPool.terminate();
    await this.stopConsoleReporter();
    logger.debug("VUs ran.");

    logger.info(`scenario "${scenarioName}" successfully executed.`);
    console.log(metrics);
  }

  override scenarioProgress(): ScenarioProgress {
    return {
      scenarioName: this.scenarioName,
      currentVus: this.currentVus,
      maxVus: this.maxVus,
      currentIterations: this.currentIterations,
      maxIterations: this.maxIterations,
      percentage: this.currentIterations / this.maxIterations * 100,
      extraInfos: "",
    };
  }
}

/**
 * Map of executors.
 */
const executors: { [key in ExecutorKind]: new () => Executor } = {
  [ExecutorKind.PerVuIteration]: ExecutorPerVuIteration,
};

export default executors;
