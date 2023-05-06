import { ExecutorKind, ScenarioOptions } from "./datatype.ts";
import ModuleURL from "./module_url.ts";

/**
 * Executor are responsible for coordinating and managing the entire life cycle
 * of a scenario.
 *
 * This is the abstract base class that handle common tasks such as initializing
 * the worker pool.
 */
abstract class Executor {
  /**
   * Execute is the core logic of an executor.
   * It is responsible for executing the given scenario.
   *
   * @param moduleURL - URL of the module to execute.
   * @param scenarioName - Name of the scenario.
   * @param scenarioOptions - Options of the scenario to run.
   */
  abstract execute(
    moduleURL: ModuleURL,
    scenarioName: string,
    scenarioOptions: ScenarioOptions,
  ): Promise<void>;
}

/**
 * Per VU iteration executor managed a fixed amount of iteration per VU.
 */
export class ExecutorPerVuIteration extends Executor {
  execute(
    _moduleURL: ModuleURL,
    _scenarioName: string,
    _scenarioOptions: ScenarioOptions,
  ): Promise<void> {
    // TODO
    return new Promise((resolve) => resolve());
  }
}

/**
 * Map of executors.
 */
const executors: { [key in ExecutorKind]: new () => Executor } = {
  [ExecutorKind.PerVuIteration]: ExecutorPerVuIteration,
};

export default executors;
