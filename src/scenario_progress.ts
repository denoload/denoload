/**
 * Progress of a scenario, this is used to print progress in console.
 */
export interface ScenarioProgress {
  percentage: number
  extraInfos: string
  aborted: boolean
}
