import * as log from "std/log/mod.ts";

export default log;

const level: log.LevelName = "INFO";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{datetime} {loggerName} [{levelName}] - {msg}",
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
