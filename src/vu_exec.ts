export interface VuExec {
  scenario: {
    name: string
    executor: string
    startTime: string
    progress: number
    iterationInInstance: number
    iterationInTest: number
  }
}
