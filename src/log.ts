import * as log from "std/log/mod.ts";

export default log;

const level: log.LevelName = "INFO";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("NOTSET", {
      formatter: (logRecord: log.LogRecord) => {
        // deno-lint-ignore no-explicit-any
        const args = logRecord.args.map((arg: any) => arg.toString()).join(" ");

        return `${logRecord.datetime.toISOString()} [${logRecord.levelName}] [${logRecord.loggerName}] - ${logRecord.msg} ${args}`;
      },
    }),
  },

  loggers: {
    // Main thread.
    "k7/main": {
      level,
      handlers: ["console"],
    },
    // Worker thread that execute Virtual User.
    "k7/worker": {
      level,
      handlers: ["console"],
    },
  },
});
