import * as readline from 'node:readline'

import executors, {
  type ScenarioOptions,
  type Executor,
  type ExecutorType
} from './executors/index.ts'
import log from './log.ts'
import * as metrics from '@negrel/denoload-metrics'
import { formatTab, padLeft, printMetrics } from './utils.ts'
import { WorkerPool } from './worker_pool.ts'
import { type ScenarioState, mergeScenarioState } from './scenario_state.ts'
import { type ScenarioProgress } from './scenario_progress.ts'

const logger = log.getLogger('runner')

/**
 * Options defines options exported by a test script.
 */
export interface TestOptions {
  threshold?: (_: { metrics: metrics.Report }) => void
  scenarios: Record<string, ScenarioOptions[ExecutorType]>
}

export async function run (moduleURL: URL): Promise<boolean> {
  let runOk = true

  logger.debug(`loading options of module "${moduleURL.toString()}"...`)
  const moduleOptions = await loadOptions(moduleURL)
  logger.debug('options loaded', moduleOptions)
  if (moduleOptions === null) {
    logger.error('no options object exported from test module')
    return false
  }

  // Create scenarios executors
  const workerPool = new WorkerPool()
  const execs: Executor[] = Object.entries(moduleOptions.scenarios).map(
    ([scenarioName, scenarioOptions]) =>
      new executors[scenarioOptions.executor](
        workerPool,
        scenarioName,
        moduleURL,
        scenarioOptions as unknown as any
      )
  )

  // Print progress every second.
  const printProgress = progressPrinter(workerPool, execs)
  const intervalId = setInterval(printProgress, 1000)

  // Start scenarios.
  const promises = await Promise.allSettled(
    execs.map(async (e) => {
      await e.execute()
    })
  )

  // Stop progress report.
  clearInterval(intervalId)

  // Clear last progress report.
  readline.moveCursor(process.stdout, 0, (execs.length + 1) * -1)
  readline.clearScreenDown(process.stdout)

  // Check if one scenario failed.
  if (promises.some((p) => p.status === 'rejected')) {
    runOk = false
    console.log('One or more scenarios failed')
  }

  // Collect metrics.
  const testMetrics = await collectAndMergeMetricsRegistry(workerPool)
  const report = metrics.report(testMetrics, [50, 90, 95, 99])

  // Execute threshold.
  if (moduleOptions.threshold !== undefined) {
    try {
      moduleOptions.threshold({ metrics: report })
    } catch (err) {
      runOk = false
      if (
        err !== null &&
        typeof err === 'object' &&
        err.constructor.name === 'JestAssertionError'
      ) {
        console.log('Threshold fails:', (err as any).matcherResult.message)
      } else if (err instanceof Error) {
        console.log('Threshold fails:', err.message)
      } else {
        console.log('Threshold fails:', err)
      }
    }
  }

  // Print metrics.
  printMetrics(testMetrics)
  console.log()
  await printProgress()

  // Clean up.
  workerPool.terminate()
  logger.info('scenarios successfully executed, exiting...')

  return runOk
}

async function loadOptions (moduleURL: URL): Promise<TestOptions | null> {
  return (await import(moduleURL.toString()))?.options
}

async function collectAndMergeMetricsRegistry (
  workerPool: WorkerPool
): Promise<metrics.RegistryObj> {
  const metricsPromises = await workerPool.forEachWorkerRemoteProcedureCall<
  [],
  metrics.RegistryObj
  >({
    name: 'metrics',
    args: []
  })
  if (metricsPromises.some((p) => p.status === 'rejected')) {
    logger.error('some metrics were lost, result may be innacurate')
  }
  const vuMetrics = metricsPromises.reduce<metrics.RegistryObj[]>((acc, p) => {
    if (p.status === 'fulfilled') acc.push(p.value)
    return acc
  }, [])

  return metrics.mergeRegistryObjects(...vuMetrics)
}

async function collectAndMergeScenariosState (
  workerPool: WorkerPool
): Promise<Record<string, ScenarioState>> {
  const promises = await workerPool.forEachWorkerRemoteProcedureCall<
  [],
  Record<string, ScenarioState>
  >({
    name: 'scenariosState',
    args: []
  })

  const scenariosState: Record<string, ScenarioState> = {}
  for (const p of promises) {
    if (p.status === 'rejected') {
      logger.error('failed to collect iterations done', p.reason)
      continue
    }

    for (const scenario in p.value) {
      if (scenariosState[scenario] !== undefined) {
        scenariosState[scenario] = mergeScenarioState(
          p.value[scenario],
          scenariosState[scenario]
        )
      } else {
        scenariosState[scenario] = p.value[scenario]
      }
    }
  }

  return scenariosState
}

function progressPrinter (
  workerPool: WorkerPool,
  execs: Executor[]
): () => Promise<void> {
  const startTime = new Date().getTime()
  const maxVUs = execs.reduce((acc, e) => acc + e.maxVUs(), 0)

  // Write some empty line so we don't erase previous lines
  // when printing progress report.
  console.log('\n'.repeat(execs.length + 1))

  return async () => {
    const scenariosStates = await collectAndMergeScenariosState(workerPool)
    const iterationsTotal = Object.values(scenariosStates).reduce(
      (acc, state) => state.iterations.success + state.iterations.fail + acc,
      0
    )

    const currentVUs = execs.reduce((acc, e) => acc + e.currentVUs(), 0)
    readline.moveCursor(process.stdout, 0, (execs.length + 1) * -1)
    readline.clearScreenDown(process.stdout)

    console.log(
      `running (${formatRunningSinceTime(
        startTime
      )}), ${currentVUs}/${maxVUs} VUs, ${iterationsTotal} complete iterations`
    )
    const lines: string[][] = []
    execs.forEach((exec) => {
      const scenarioProgress = exec.scenarioProgress(
        scenariosStates[exec.scenarioName]
      )
      lines.push(formatScenarioProgress(exec.scenarioName, scenarioProgress))
    })
    console.log(formatTab(lines).join('\n'))
  }
}

function formatRunningSinceTime (startTime: number): string {
  const runningSince = new Date().getTime() - startTime
  let seconds = Math.floor(runningSince / 1000)
  const minutes = Math.floor(seconds / 60)
  seconds = seconds % 60

  return `${padLeft(minutes.toString(), '0', 2)}m${padLeft(
    seconds.toString(),
    '0',
    2
  )}s`
}

const progressBarEmptyChar =
  '--------------------------------------------------'
const progressBarFullChar =
  '=================================================='

function formatScenarioProgress (
  scenarioName: string,
  progress: ScenarioProgress
): string[] {
  const percentage = Math.floor(progress.percentage)

  return [
    scenarioName,
    progress.percentage === 100 ? '✓' : progress.aborted ? '✗' : ' ',
    '[' +
      progressBarFullChar.slice(0, Math.floor(percentage / 2)) +
      progressBarEmptyChar.slice(
        0,
        progressBarEmptyChar.length - Math.floor(percentage / 2)
      ) +
      ']',
    progress.extraInfos
  ]
}
