/**
 * Enumeration of available executors.
 */
export enum ExecutorKind {
  // A fixed amount of iteration per VU
  PerVuIteration = "per-vu-iterations",
}

/**
 * Options defines options exported by a test script.
 */
export interface Options {
  scenarios: {
    [key: string]: ScenarioOptions;
  };
}

/**
 * ScenarioOptions defines options of a scenario exported by a test script.
 */
export interface ScenarioOptions {
  executor: ExecutorKind;
  vus: number;
  iterations: number;
}
