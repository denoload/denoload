/**
 * Current state of a scenario.
 */
export interface ScenarioState {
  iterations: {
    fail: number
    success: number
  }
  aborted: boolean
}

export function mergeScenarioState (...states: ScenarioState[]): ScenarioState {
  const result: ScenarioState = {
    iterations: {
      fail: 0,
      success: 0
    },
    aborted: false
  }

  for (const state of states) {
    result.iterations.success += state.iterations.success
    result.iterations.fail += state.iterations.fail
    result.aborted ||= state.aborted
  }

  return result
}
