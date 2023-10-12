import * as bunyan from 'bunyan'
import type Logger from 'bunyan'

export function getLogger (name: string): Logger {
  return bunyan.createLogger({
    name,
    level: 'info',
    stream: process.stderr
  })
}

export default {
  getLogger
}
