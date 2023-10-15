import { type Options } from './datatypes.ts'
import executors from './executors.ts'
import * as log from './log.ts'

const logger = log.getLogger('main')

/**
 * Load a module and its exported options.
 *
 * @param moduleURL - URL of the module to load.
 * @returns Options exported by the module.
 *
 * @throws {@link TypeError}
 * This exception is thrown if the module can't bet imported.
 */
async function loadOptions (moduleURL: URL): Promise<Options> {
  const module = await import(moduleURL.toString())
  // TODO(@negrel): validate options object before returning it.
  return module.options
}

function printAsciiArt (): void {
  const dino = [
    '                  __  ',
    '           --    / _) ',
    '---  -- _.----._/ /   ',
    '  ---  /   --    /    ',
    '--- __/ (  | (  |     ',
    "   /__.-'|_|--|_|     "
  ]
  const denoload = [
    ' ___                   _                _ ',
    '|   \\  ___  _ _   ___ | | ___  __ _  __| |',
    "| |) |/ -_)| ' \\ / _ \\| |/ _ \\/ _` |/ _` |",
    '|___/ \\___||_||_|\\___/|_|\\___/\\__/_|\\__/_|'
  ]

  for (let i = 0; i < 6; i++) {
    let str = dino[i]
    if (i >= 1 && i < 5) {
      str += denoload[i - 1]
    }
    console.log(str)
  }
  console.log()
}

process.on('SIGINT', () => {
  logger.warn('denoload received SIGINT...')
  process.exit(1)
})

void (async () => {
  printAsciiArt()
  const moduleURL = (() => {
    logger.debug('CLI arguments', Bun.argv)

    if (Bun.argv.length < 3) {
      logger.error('modules URL missing')
      process.exit(1)
    }

    return new URL(Bun.argv[2], 'file://' + process.cwd() + '/')
  })()

  logger.debug(`loading options of module "${moduleURL.toString()}"...`)
  const options = await loadOptions(moduleURL)
  logger.debug('loaded options', options)

  for (
    const [scenarioName, scenarioOptions] of Object.entries(options.scenarios)
  ) {
    const executor = new executors[scenarioOptions.executor]()
    await executor.execute(moduleURL, scenarioName, scenarioOptions)
  }

  logger.info('scenarios successfully executed, exiting...')
})()
