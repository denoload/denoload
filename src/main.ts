import { program } from 'commander'

import { type Options } from './datatypes.ts'
import executors from './executors.ts'
import * as log from './log.ts'
import { VERSION } from './version.ts'

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
    '  ---  /         /    ',
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

  program
    .name('denoload')
    .description('Modern load testing tool using JavaScript and TypeScript, inspired by k6.')
    .version(VERSION)

  program.command('run')
    .description('Start a test')
    .argument('<file_path>', 'path to test file')
    .action(async (testfile) => {
      const moduleURL = new URL(testfile, 'file://' + process.cwd() + '/')

      logger.debug(`loading options of module "${moduleURL.toString()}"...`)
      const moduleOptions = await loadOptions(moduleURL)
      logger.debug('loaded options', moduleOptions)

      for (
        const [scenarioName, scenarioOptions] of Object.entries(moduleOptions.scenarios)
      ) {
        const executor = new executors[scenarioOptions.executor]()
        await executor.execute(moduleURL, scenarioName, scenarioOptions)
      }

      logger.info('scenarios successfully executed, exiting...')
    })
  program.parse()
})()
