import * as bunyan from 'bunyan'
import Logger from 'bunyan'

export { Logger }

const level = process.env.NODE_ENV === 'production'
  ? 'warn'
  : process.env.DEBUG !== undefined ? 'debug' : 'info'

export function getLogger (name: string): Logger {
  return bunyan.createLogger({
    name,
    level,
    stream: process.stderr
  })
}

export default {
  getLogger,
  Logger
}
