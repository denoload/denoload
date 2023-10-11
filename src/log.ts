import * as log from "std/log/mod.ts";

export default log;

const level: log.LevelName = "WARNING";

log.setup({
  handlers: {
    main: new log.handlers.ConsoleHandler("NOTSET", {
      formatter: (logRecord: log.LogRecord) => {
        // deno-lint-ignore no-explicit-any
        const args = logRecord.args.map((arg: any) => arg.toString()).join(" ");

        return `${logRecord.datetime.toISOString()} [${logRecord.levelName}] [${logRecord.loggerName}] - ${logRecord.msg} ${args}`;
      },
    }),
  },
  loggers: {
    // Main thread.
    "main": {
      level,
      handlers: ["main"],
    },
  },
});
