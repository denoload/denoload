import * as bunyan from 'bunyan'
import type Logger from 'bunyan'

const level = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'

export function getLogger (name: string): Logger {
  return bunyan.createLogger({
    name,
    level,
    stream: process.stderr
  })
}

export default {
  getLogger
}
