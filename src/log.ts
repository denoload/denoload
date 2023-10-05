import * as log from "std/log/mod.ts";

export default log;

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{datetime} {loggerName} [{levelName}] - {msg}",
    }),
  },

  loggers: {
    // Main thread.
    "k7/main": {
      level: "DEBUG",
      handlers: ["console"],
    },
    // Worker thread that execute Virtual User.
    "k7/worker": {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});
