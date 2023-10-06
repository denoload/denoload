import * as log from "std/log/mod.ts";

export default log;

const level: log.LevelName = "INFO";

log.setup({
  handlers: {
    main: new log.handlers.ConsoleHandler("NOTSET", {
      formatter: (logRecord: log.LogRecord) => {
        // deno-lint-ignore no-explicit-any
        const args = logRecord.args.map((arg: any) => arg.toString()).join(" ");

        return `${logRecord.datetime.toISOString()} [${logRecord.levelName}] [${logRecord.loggerName}] - ${logRecord.msg} ${args}`;
      },
    }),
    worker: new log.handlers.ConsoleHandler("NOTSET", {
      formatter: (logRecord: log.LogRecord) => {
        const [workerId] = logRecord.args;

        // deno-lint-ignore no-explicit-any
        const args = logRecord.args.slice(1).map((arg: any) => arg.toString())
          .join(" ");

        return `${logRecord.datetime.toISOString()} [${logRecord.levelName}] [${logRecord.loggerName}/${workerId}] - ${logRecord.msg} ${args}`;
      },
    }),
  },

  loggers: {
    // Main thread.
    "main": {
      level,
      handlers: ["main"],
    },
    // Worker thread that execute Virtual User.
    "worker": {
      level,
      handlers: ["worker"],
    },
  },
});
