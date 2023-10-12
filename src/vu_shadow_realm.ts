// ShadowRealm doesn't support asynchronous communication, we can't await
// promises in exported function.
/* eslint-disable @typescript-eslint/no-floating-promises */

export enum IterationStatus {
  Running = 0,
  Done = 1,
  Error = 2,
}

const iterationInfos: { status: IterationStatus, error: Error | null } = {
  status: IterationStatus.Done,
  error: null
}

/**
 * Start a floating promise that perform a single VU iteration.
 */
export function startIteration (moduleURL: string, vu: number, iter: number): void {
  import(moduleURL).then(async (module) => {
    iterationInfos.status = IterationStatus.Running
    iterationInfos.error = null

    await module.default(vu, iter)

    iterationInfos.status = IterationStatus.Done
  }).catch((err) => {
    iterationInfos.status = IterationStatus.Error
    iterationInfos.error = err
  })
}

export function iterationStatus (): IterationStatus {
  return iterationInfos.status
}

export function iterationError (): string {
  return iterationInfos.error?.stack ?? ''
}
