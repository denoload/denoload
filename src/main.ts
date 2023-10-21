import { program } from 'commander'

import * as log from './log.ts'
import { VERSION } from './version.ts'
import { run } from './runner.ts'

const logger = log.getLogger('main')

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
      await run(moduleURL)
    })
  program.parse()
})()
