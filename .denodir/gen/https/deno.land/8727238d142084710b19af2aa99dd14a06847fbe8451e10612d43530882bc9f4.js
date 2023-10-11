// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Logging library with the support for terminal and file outputs. Also provides
 * interfaces for building custom loggers.
 *
 * ## Loggers
 *
 * Loggers are objects that you interact with. When you use a logger method it
 * constructs a `LogRecord` and passes it down to its handlers for output. To
 * create custom loggers, specify them in `loggers` when calling `log.setup`.
 *
 * ## Custom message format
 *
 * If you want to override default format of message you can define `formatter`
 * option for handler. It can be either simple string-based format that uses
 * `LogRecord` fields or more complicated function-based one that takes `LogRecord`
 * as argument and outputs string.
 *
 * The default log format is `{levelName} {msg}`.
 *
 * ## Inline Logging
 *
 * Log functions return the data passed in the `msg` parameter. Data is returned
 * regardless if the logger actually logs it.
 *
 * ## Lazy Log Evaluation
 *
 * Some log statements are expensive to compute. In these cases, you can use
 * lazy log evaluation to prevent the computation taking place if the logger
 * won't log the message.
 *
 * > NOTE: When using lazy log evaluation, `undefined` will be returned if the
 * > resolver function is not called because the logger won't log it. It is an
 * > antipattern use lazy evaluation with inline logging because the return value
 * > depends on the current log level.
 *
 * ## For module authors
 *
 * The authors of public modules can let the users display the internal logs of the
 * module by using a custom logger:
 *
 * ```ts
 * import { getLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * function logger() {
 *   return getLogger("my-awesome-module");
 * }
 *
 * export function sum(a: number, b: number) {
 *   logger().debug(`running ${a} + ${b}`);
 *   return a + b;
 * }
 *
 * export function mult(a: number, b: number) {
 *   logger().debug(`running ${a} * ${b}`);
 *   return a * b;
 * }
 * ```
 *
 * The user of the module can then display the internal logs with:
 *
 * ```ts, ignore
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 * import { sum } from "<the-awesome-module>/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     console: new log.handlers.ConsoleHandler("DEBUG"),
 *   },
 *
 *   loggers: {
 *     "my-awesome-module": {
 *       level: "DEBUG",
 *       handlers: ["console"],
 *     },
 *   },
 * });
 *
 * sum(1, 2); // prints "running 1 + 2" to the console
 * ```
 *
 * Please note that, due to the order of initialization of the loggers, the
 * following won't work:
 *
 * ```ts
 * import { getLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * const logger = getLogger("my-awesome-module");
 *
 * export function sum(a: number, b: number) {
 *   logger.debug(`running ${a} + ${b}`); // no message will be logged, because getLogger() was called before log.setup()
 *   return a + b;
 * }
 * ```
 *
 * @example
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * // Simple default logger out of the box. You can customize it
 * // by overriding logger and handler named "default", or providing
 * // additional logger configurations. You can log any data type.
 * log.debug("Hello world");
 * log.info(123456);
 * log.warning(true);
 * log.error({ foo: "bar", fizz: "bazz" });
 * log.critical("500 Internal server error");
 *
 * // custom configuration with 2 loggers (the default and `tasks` loggers).
 * log.setup({
 *   handlers: {
 *     console: new log.handlers.ConsoleHandler("DEBUG"),
 *
 *     file: new log.handlers.FileHandler("WARNING", {
 *       filename: "./log.txt",
 *       // you can change format of output message using any keys in `LogRecord`.
 *       formatter: "{levelName} {msg}",
 *     }),
 *   },
 *
 *   loggers: {
 *     // configure default logger available via short-hand methods above.
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["console", "file"],
 *     },
 *
 *     tasks: {
 *       level: "ERROR",
 *       handlers: ["console"],
 *     },
 *   },
 * });
 *
 * let logger;
 *
 * // get default logger.
 * logger = log.getLogger();
 * logger.debug("fizz"); // logs to `console`, because `file` handler requires "WARNING" level.
 * logger.warning(41256); // logs to both `console` and `file` handlers.
 *
 * // get custom logger
 * logger = log.getLogger("tasks");
 * logger.debug("fizz"); // won't get output because this logger has "ERROR" level.
 * logger.error({ productType: "book", value: "126.11" }); // log to `console`.
 *
 * // if you try to use a logger that hasn't been configured
 * // you're good to go, it gets created automatically with level set to 0
 * // so no message is logged.
 * const unknownLogger = log.getLogger("mystery");
 * unknownLogger.info("foobar"); // no-op
 * ```
 *
 * @example
 * Custom message format example
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     stringFmt: new log.handlers.ConsoleHandler("DEBUG", {
 *       formatter: "[{levelName}] {msg}",
 *     }),
 *
 *     functionFmt: new log.handlers.ConsoleHandler("DEBUG", {
 *       formatter: (logRecord) => {
 *         let msg = `${logRecord.level} ${logRecord.msg}`;
 *
 *         logRecord.args.forEach((arg, index) => {
 *           msg += `, arg${index}: ${arg}`;
 *         });
 *
 *         return msg;
 *       },
 *     }),
 *
 *     anotherFmt: new log.handlers.ConsoleHandler("DEBUG", {
 *       formatter: "[{loggerName}] - {levelName} {msg}",
 *     }),
 *   },
 *
 *   loggers: {
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["stringFmt", "functionFmt"],
 *     },
 *     dataLogger: {
 *       level: "INFO",
 *       handlers: ["anotherFmt"],
 *     },
 *   },
 * });
 *
 * // calling:
 * log.debug("Hello, world!", 1, "two", [3, 4, 5]);
 * // results in: [DEBUG] Hello, world!
 * // output from "stringFmt" handler.
 * // 10 Hello, world!, arg0: 1, arg1: two, arg3: [3, 4, 5] // output from "functionFmt" formatter.
 *
 * // calling:
 * log.getLogger("dataLogger").error("oh no!");
 * // results in:
 * // [dataLogger] - ERROR oh no! // output from anotherFmt handler.
 * ```
 *
 * @example
 * Inline Logging
 * ```ts
 * import * as logger from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * const stringData: string = logger.debug("hello world");
 * const booleanData: boolean = logger.debug(true, 1, "abc");
 * const fn = (): number => {
 *   return 123;
 * };
 * const resolvedFunctionData: number = logger.debug(fn());
 * console.log(stringData); // 'hello world'
 * console.log(booleanData); // true
 * console.log(resolvedFunctionData); // 123
 * ```
 *
 * @example
 * Lazy Log Evaluation
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     console: new log.handlers.ConsoleHandler("DEBUG"),
 *   },
 *
 *   loggers: {
 *     tasks: {
 *       level: "ERROR",
 *       handlers: ["console"],
 *     },
 *   },
 * });
 *
 * function someExpensiveFn(num: number, bool: boolean) {
 *   // do some expensive computation
 * }
 *
 * // not logged, as debug < error.
 * const data = log.debug(() => someExpensiveFn(5, true));
 * console.log(data); // undefined
 * ```
 *
 * @module
 */ import { Logger } from "./logger.ts";
import { BaseHandler, ConsoleHandler, FileHandler, RotatingFileHandler, WriterHandler } from "./handlers.ts";
import { assert } from "../assert/assert.ts";
export { LogLevels } from "./levels.ts";
export { Logger } from "./logger.ts";
export class LoggerConfig {
  level;
  handlers;
}
const DEFAULT_LEVEL = "INFO";
const DEFAULT_CONFIG = {
  handlers: {
    default: new ConsoleHandler(DEFAULT_LEVEL)
  },
  loggers: {
    default: {
      level: DEFAULT_LEVEL,
      handlers: [
        "default"
      ]
    }
  }
};
const state = {
  handlers: new Map(),
  loggers: new Map(),
  config: DEFAULT_CONFIG
};
/**
 * Handlers are responsible for actual output of log messages. When a handler is
 * called by a logger, it firstly checks that {@linkcode LogRecord}'s level is
 * not lower than level of the handler. If level check passes, handlers formats
 * log record into string and outputs it to target.
 *
 * ## Custom handlers
 *
 * Custom handlers can be implemented by subclassing {@linkcode BaseHandler} or
 * {@linkcode WriterHandler}.
 *
 * {@linkcode BaseHandler} is bare-bones handler that has no output logic at all,
 *
 * {@linkcode WriterHandler} is an abstract class that supports any target with
 * `Writer` interface.
 *
 * During setup async hooks `setup` and `destroy` are called, you can use them
 * to open and close file/HTTP connection or any other action you might need.
 *
 * For examples check source code of {@linkcode FileHandler}`
 * and {@linkcode TestHandler}.
 */ export const handlers = {
  BaseHandler,
  ConsoleHandler,
  WriterHandler,
  FileHandler,
  RotatingFileHandler
};
/** Get a logger instance. If not specified `name`, get the default logger. */ export function getLogger(name) {
  if (!name) {
    const d = state.loggers.get("default");
    assert(d !== undefined, `"default" logger must be set for getting logger without name`);
    return d;
  }
  const result = state.loggers.get(name);
  if (!result) {
    const logger = new Logger(name, "NOTSET", {
      handlers: []
    });
    state.loggers.set(name, logger);
    return logger;
  }
  return result;
}
export function debug(msg, ...args) {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").debug(msg, ...args);
  }
  return getLogger("default").debug(msg, ...args);
}
export function info(msg, ...args) {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").info(msg, ...args);
  }
  return getLogger("default").info(msg, ...args);
}
export function warning(msg, ...args) {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").warning(msg, ...args);
  }
  return getLogger("default").warning(msg, ...args);
}
export function error(msg, ...args) {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").error(msg, ...args);
  }
  return getLogger("default").error(msg, ...args);
}
export function critical(msg, ...args) {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").critical(msg, ...args);
  }
  return getLogger("default").critical(msg, ...args);
}
/** Setup logger config. */ export function setup(config) {
  state.config = {
    handlers: {
      ...DEFAULT_CONFIG.handlers,
      ...config.handlers
    },
    loggers: {
      ...DEFAULT_CONFIG.loggers,
      ...config.loggers
    }
  };
  // tear down existing handlers
  state.handlers.forEach((handler)=>{
    handler.destroy();
  });
  state.handlers.clear();
  // setup handlers
  const handlers = state.config.handlers || {};
  for(const handlerName in handlers){
    const handler = handlers[handlerName];
    handler.setup();
    state.handlers.set(handlerName, handler);
  }
  // remove existing loggers
  state.loggers.clear();
  // setup loggers
  const loggers = state.config.loggers || {};
  for(const loggerName in loggers){
    const loggerConfig = loggers[loggerName];
    const handlerNames = loggerConfig.handlers || [];
    const handlers = [];
    handlerNames.forEach((handlerName)=>{
      const handler = state.handlers.get(handlerName);
      if (handler) {
        handlers.push(handler);
      }
    });
    const levelName = loggerConfig.level || DEFAULT_LEVEL;
    const logger = new Logger(loggerName, levelName, {
      handlers: handlers
    });
    state.loggers.set(loggerName, logger);
  }
}
setup(DEFAULT_CONFIG);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2xvZy9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqXG4gKiBMb2dnaW5nIGxpYnJhcnkgd2l0aCB0aGUgc3VwcG9ydCBmb3IgdGVybWluYWwgYW5kIGZpbGUgb3V0cHV0cy4gQWxzbyBwcm92aWRlc1xuICogaW50ZXJmYWNlcyBmb3IgYnVpbGRpbmcgY3VzdG9tIGxvZ2dlcnMuXG4gKlxuICogIyMgTG9nZ2Vyc1xuICpcbiAqIExvZ2dlcnMgYXJlIG9iamVjdHMgdGhhdCB5b3UgaW50ZXJhY3Qgd2l0aC4gV2hlbiB5b3UgdXNlIGEgbG9nZ2VyIG1ldGhvZCBpdFxuICogY29uc3RydWN0cyBhIGBMb2dSZWNvcmRgIGFuZCBwYXNzZXMgaXQgZG93biB0byBpdHMgaGFuZGxlcnMgZm9yIG91dHB1dC4gVG9cbiAqIGNyZWF0ZSBjdXN0b20gbG9nZ2Vycywgc3BlY2lmeSB0aGVtIGluIGBsb2dnZXJzYCB3aGVuIGNhbGxpbmcgYGxvZy5zZXR1cGAuXG4gKlxuICogIyMgQ3VzdG9tIG1lc3NhZ2UgZm9ybWF0XG4gKlxuICogSWYgeW91IHdhbnQgdG8gb3ZlcnJpZGUgZGVmYXVsdCBmb3JtYXQgb2YgbWVzc2FnZSB5b3UgY2FuIGRlZmluZSBgZm9ybWF0dGVyYFxuICogb3B0aW9uIGZvciBoYW5kbGVyLiBJdCBjYW4gYmUgZWl0aGVyIHNpbXBsZSBzdHJpbmctYmFzZWQgZm9ybWF0IHRoYXQgdXNlc1xuICogYExvZ1JlY29yZGAgZmllbGRzIG9yIG1vcmUgY29tcGxpY2F0ZWQgZnVuY3Rpb24tYmFzZWQgb25lIHRoYXQgdGFrZXMgYExvZ1JlY29yZGBcbiAqIGFzIGFyZ3VtZW50IGFuZCBvdXRwdXRzIHN0cmluZy5cbiAqXG4gKiBUaGUgZGVmYXVsdCBsb2cgZm9ybWF0IGlzIGB7bGV2ZWxOYW1lfSB7bXNnfWAuXG4gKlxuICogIyMgSW5saW5lIExvZ2dpbmdcbiAqXG4gKiBMb2cgZnVuY3Rpb25zIHJldHVybiB0aGUgZGF0YSBwYXNzZWQgaW4gdGhlIGBtc2dgIHBhcmFtZXRlci4gRGF0YSBpcyByZXR1cm5lZFxuICogcmVnYXJkbGVzcyBpZiB0aGUgbG9nZ2VyIGFjdHVhbGx5IGxvZ3MgaXQuXG4gKlxuICogIyMgTGF6eSBMb2cgRXZhbHVhdGlvblxuICpcbiAqIFNvbWUgbG9nIHN0YXRlbWVudHMgYXJlIGV4cGVuc2l2ZSB0byBjb21wdXRlLiBJbiB0aGVzZSBjYXNlcywgeW91IGNhbiB1c2VcbiAqIGxhenkgbG9nIGV2YWx1YXRpb24gdG8gcHJldmVudCB0aGUgY29tcHV0YXRpb24gdGFraW5nIHBsYWNlIGlmIHRoZSBsb2dnZXJcbiAqIHdvbid0IGxvZyB0aGUgbWVzc2FnZS5cbiAqXG4gKiA+IE5PVEU6IFdoZW4gdXNpbmcgbGF6eSBsb2cgZXZhbHVhdGlvbiwgYHVuZGVmaW5lZGAgd2lsbCBiZSByZXR1cm5lZCBpZiB0aGVcbiAqID4gcmVzb2x2ZXIgZnVuY3Rpb24gaXMgbm90IGNhbGxlZCBiZWNhdXNlIHRoZSBsb2dnZXIgd29uJ3QgbG9nIGl0LiBJdCBpcyBhblxuICogPiBhbnRpcGF0dGVybiB1c2UgbGF6eSBldmFsdWF0aW9uIHdpdGggaW5saW5lIGxvZ2dpbmcgYmVjYXVzZSB0aGUgcmV0dXJuIHZhbHVlXG4gKiA+IGRlcGVuZHMgb24gdGhlIGN1cnJlbnQgbG9nIGxldmVsLlxuICpcbiAqICMjIEZvciBtb2R1bGUgYXV0aG9yc1xuICpcbiAqIFRoZSBhdXRob3JzIG9mIHB1YmxpYyBtb2R1bGVzIGNhbiBsZXQgdGhlIHVzZXJzIGRpc3BsYXkgdGhlIGludGVybmFsIGxvZ3Mgb2YgdGhlXG4gKiBtb2R1bGUgYnkgdXNpbmcgYSBjdXN0b20gbG9nZ2VyOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBnZXRMb2dnZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9sb2cvbW9kLnRzXCI7XG4gKlxuICogZnVuY3Rpb24gbG9nZ2VyKCkge1xuICogICByZXR1cm4gZ2V0TG9nZ2VyKFwibXktYXdlc29tZS1tb2R1bGVcIik7XG4gKiB9XG4gKlxuICogZXhwb3J0IGZ1bmN0aW9uIHN1bShhOiBudW1iZXIsIGI6IG51bWJlcikge1xuICogICBsb2dnZXIoKS5kZWJ1ZyhgcnVubmluZyAke2F9ICsgJHtifWApO1xuICogICByZXR1cm4gYSArIGI7XG4gKiB9XG4gKlxuICogZXhwb3J0IGZ1bmN0aW9uIG11bHQoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAqICAgbG9nZ2VyKCkuZGVidWcoYHJ1bm5pbmcgJHthfSAqICR7Yn1gKTtcbiAqICAgcmV0dXJuIGEgKiBiO1xuICogfVxuICogYGBgXG4gKlxuICogVGhlIHVzZXIgb2YgdGhlIG1vZHVsZSBjYW4gdGhlbiBkaXNwbGF5IHRoZSBpbnRlcm5hbCBsb2dzIHdpdGg6XG4gKlxuICogYGBgdHMsIGlnbm9yZVxuICogaW1wb3J0ICogYXMgbG9nIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqIGltcG9ydCB7IHN1bSB9IGZyb20gXCI8dGhlLWF3ZXNvbWUtbW9kdWxlPi9tb2QudHNcIjtcbiAqXG4gKiBsb2cuc2V0dXAoe1xuICogICBoYW5kbGVyczoge1xuICogICAgIGNvbnNvbGU6IG5ldyBsb2cuaGFuZGxlcnMuQ29uc29sZUhhbmRsZXIoXCJERUJVR1wiKSxcbiAqICAgfSxcbiAqXG4gKiAgIGxvZ2dlcnM6IHtcbiAqICAgICBcIm15LWF3ZXNvbWUtbW9kdWxlXCI6IHtcbiAqICAgICAgIGxldmVsOiBcIkRFQlVHXCIsXG4gKiAgICAgICBoYW5kbGVyczogW1wiY29uc29sZVwiXSxcbiAqICAgICB9LFxuICogICB9LFxuICogfSk7XG4gKlxuICogc3VtKDEsIDIpOyAvLyBwcmludHMgXCJydW5uaW5nIDEgKyAyXCIgdG8gdGhlIGNvbnNvbGVcbiAqIGBgYFxuICpcbiAqIFBsZWFzZSBub3RlIHRoYXQsIGR1ZSB0byB0aGUgb3JkZXIgb2YgaW5pdGlhbGl6YXRpb24gb2YgdGhlIGxvZ2dlcnMsIHRoZVxuICogZm9sbG93aW5nIHdvbid0IHdvcms6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGdldExvZ2dlciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiBjb25zdCBsb2dnZXIgPSBnZXRMb2dnZXIoXCJteS1hd2Vzb21lLW1vZHVsZVwiKTtcbiAqXG4gKiBleHBvcnQgZnVuY3Rpb24gc3VtKGE6IG51bWJlciwgYjogbnVtYmVyKSB7XG4gKiAgIGxvZ2dlci5kZWJ1ZyhgcnVubmluZyAke2F9ICsgJHtifWApOyAvLyBubyBtZXNzYWdlIHdpbGwgYmUgbG9nZ2VkLCBiZWNhdXNlIGdldExvZ2dlcigpIHdhcyBjYWxsZWQgYmVmb3JlIGxvZy5zZXR1cCgpXG4gKiAgIHJldHVybiBhICsgYjtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0ICogYXMgbG9nIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiAvLyBTaW1wbGUgZGVmYXVsdCBsb2dnZXIgb3V0IG9mIHRoZSBib3guIFlvdSBjYW4gY3VzdG9taXplIGl0XG4gKiAvLyBieSBvdmVycmlkaW5nIGxvZ2dlciBhbmQgaGFuZGxlciBuYW1lZCBcImRlZmF1bHRcIiwgb3IgcHJvdmlkaW5nXG4gKiAvLyBhZGRpdGlvbmFsIGxvZ2dlciBjb25maWd1cmF0aW9ucy4gWW91IGNhbiBsb2cgYW55IGRhdGEgdHlwZS5cbiAqIGxvZy5kZWJ1ZyhcIkhlbGxvIHdvcmxkXCIpO1xuICogbG9nLmluZm8oMTIzNDU2KTtcbiAqIGxvZy53YXJuaW5nKHRydWUpO1xuICogbG9nLmVycm9yKHsgZm9vOiBcImJhclwiLCBmaXp6OiBcImJhenpcIiB9KTtcbiAqIGxvZy5jcml0aWNhbChcIjUwMCBJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIik7XG4gKlxuICogLy8gY3VzdG9tIGNvbmZpZ3VyYXRpb24gd2l0aCAyIGxvZ2dlcnMgKHRoZSBkZWZhdWx0IGFuZCBgdGFza3NgIGxvZ2dlcnMpLlxuICogbG9nLnNldHVwKHtcbiAqICAgaGFuZGxlcnM6IHtcbiAqICAgICBjb25zb2xlOiBuZXcgbG9nLmhhbmRsZXJzLkNvbnNvbGVIYW5kbGVyKFwiREVCVUdcIiksXG4gKlxuICogICAgIGZpbGU6IG5ldyBsb2cuaGFuZGxlcnMuRmlsZUhhbmRsZXIoXCJXQVJOSU5HXCIsIHtcbiAqICAgICAgIGZpbGVuYW1lOiBcIi4vbG9nLnR4dFwiLFxuICogICAgICAgLy8geW91IGNhbiBjaGFuZ2UgZm9ybWF0IG9mIG91dHB1dCBtZXNzYWdlIHVzaW5nIGFueSBrZXlzIGluIGBMb2dSZWNvcmRgLlxuICogICAgICAgZm9ybWF0dGVyOiBcIntsZXZlbE5hbWV9IHttc2d9XCIsXG4gKiAgICAgfSksXG4gKiAgIH0sXG4gKlxuICogICBsb2dnZXJzOiB7XG4gKiAgICAgLy8gY29uZmlndXJlIGRlZmF1bHQgbG9nZ2VyIGF2YWlsYWJsZSB2aWEgc2hvcnQtaGFuZCBtZXRob2RzIGFib3ZlLlxuICogICAgIGRlZmF1bHQ6IHtcbiAqICAgICAgIGxldmVsOiBcIkRFQlVHXCIsXG4gKiAgICAgICBoYW5kbGVyczogW1wiY29uc29sZVwiLCBcImZpbGVcIl0sXG4gKiAgICAgfSxcbiAqXG4gKiAgICAgdGFza3M6IHtcbiAqICAgICAgIGxldmVsOiBcIkVSUk9SXCIsXG4gKiAgICAgICBoYW5kbGVyczogW1wiY29uc29sZVwiXSxcbiAqICAgICB9LFxuICogICB9LFxuICogfSk7XG4gKlxuICogbGV0IGxvZ2dlcjtcbiAqXG4gKiAvLyBnZXQgZGVmYXVsdCBsb2dnZXIuXG4gKiBsb2dnZXIgPSBsb2cuZ2V0TG9nZ2VyKCk7XG4gKiBsb2dnZXIuZGVidWcoXCJmaXp6XCIpOyAvLyBsb2dzIHRvIGBjb25zb2xlYCwgYmVjYXVzZSBgZmlsZWAgaGFuZGxlciByZXF1aXJlcyBcIldBUk5JTkdcIiBsZXZlbC5cbiAqIGxvZ2dlci53YXJuaW5nKDQxMjU2KTsgLy8gbG9ncyB0byBib3RoIGBjb25zb2xlYCBhbmQgYGZpbGVgIGhhbmRsZXJzLlxuICpcbiAqIC8vIGdldCBjdXN0b20gbG9nZ2VyXG4gKiBsb2dnZXIgPSBsb2cuZ2V0TG9nZ2VyKFwidGFza3NcIik7XG4gKiBsb2dnZXIuZGVidWcoXCJmaXp6XCIpOyAvLyB3b24ndCBnZXQgb3V0cHV0IGJlY2F1c2UgdGhpcyBsb2dnZXIgaGFzIFwiRVJST1JcIiBsZXZlbC5cbiAqIGxvZ2dlci5lcnJvcih7IHByb2R1Y3RUeXBlOiBcImJvb2tcIiwgdmFsdWU6IFwiMTI2LjExXCIgfSk7IC8vIGxvZyB0byBgY29uc29sZWAuXG4gKlxuICogLy8gaWYgeW91IHRyeSB0byB1c2UgYSBsb2dnZXIgdGhhdCBoYXNuJ3QgYmVlbiBjb25maWd1cmVkXG4gKiAvLyB5b3UncmUgZ29vZCB0byBnbywgaXQgZ2V0cyBjcmVhdGVkIGF1dG9tYXRpY2FsbHkgd2l0aCBsZXZlbCBzZXQgdG8gMFxuICogLy8gc28gbm8gbWVzc2FnZSBpcyBsb2dnZWQuXG4gKiBjb25zdCB1bmtub3duTG9nZ2VyID0gbG9nLmdldExvZ2dlcihcIm15c3RlcnlcIik7XG4gKiB1bmtub3duTG9nZ2VyLmluZm8oXCJmb29iYXJcIik7IC8vIG5vLW9wXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogQ3VzdG9tIG1lc3NhZ2UgZm9ybWF0IGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgKiBhcyBsb2cgZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbG9nL21vZC50c1wiO1xuICpcbiAqIGxvZy5zZXR1cCh7XG4gKiAgIGhhbmRsZXJzOiB7XG4gKiAgICAgc3RyaW5nRm10OiBuZXcgbG9nLmhhbmRsZXJzLkNvbnNvbGVIYW5kbGVyKFwiREVCVUdcIiwge1xuICogICAgICAgZm9ybWF0dGVyOiBcIlt7bGV2ZWxOYW1lfV0ge21zZ31cIixcbiAqICAgICB9KSxcbiAqXG4gKiAgICAgZnVuY3Rpb25GbXQ6IG5ldyBsb2cuaGFuZGxlcnMuQ29uc29sZUhhbmRsZXIoXCJERUJVR1wiLCB7XG4gKiAgICAgICBmb3JtYXR0ZXI6IChsb2dSZWNvcmQpID0+IHtcbiAqICAgICAgICAgbGV0IG1zZyA9IGAke2xvZ1JlY29yZC5sZXZlbH0gJHtsb2dSZWNvcmQubXNnfWA7XG4gKlxuICogICAgICAgICBsb2dSZWNvcmQuYXJncy5mb3JFYWNoKChhcmcsIGluZGV4KSA9PiB7XG4gKiAgICAgICAgICAgbXNnICs9IGAsIGFyZyR7aW5kZXh9OiAke2FyZ31gO1xuICogICAgICAgICB9KTtcbiAqXG4gKiAgICAgICAgIHJldHVybiBtc2c7XG4gKiAgICAgICB9LFxuICogICAgIH0pLFxuICpcbiAqICAgICBhbm90aGVyRm10OiBuZXcgbG9nLmhhbmRsZXJzLkNvbnNvbGVIYW5kbGVyKFwiREVCVUdcIiwge1xuICogICAgICAgZm9ybWF0dGVyOiBcIlt7bG9nZ2VyTmFtZX1dIC0ge2xldmVsTmFtZX0ge21zZ31cIixcbiAqICAgICB9KSxcbiAqICAgfSxcbiAqXG4gKiAgIGxvZ2dlcnM6IHtcbiAqICAgICBkZWZhdWx0OiB7XG4gKiAgICAgICBsZXZlbDogXCJERUJVR1wiLFxuICogICAgICAgaGFuZGxlcnM6IFtcInN0cmluZ0ZtdFwiLCBcImZ1bmN0aW9uRm10XCJdLFxuICogICAgIH0sXG4gKiAgICAgZGF0YUxvZ2dlcjoge1xuICogICAgICAgbGV2ZWw6IFwiSU5GT1wiLFxuICogICAgICAgaGFuZGxlcnM6IFtcImFub3RoZXJGbXRcIl0sXG4gKiAgICAgfSxcbiAqICAgfSxcbiAqIH0pO1xuICpcbiAqIC8vIGNhbGxpbmc6XG4gKiBsb2cuZGVidWcoXCJIZWxsbywgd29ybGQhXCIsIDEsIFwidHdvXCIsIFszLCA0LCA1XSk7XG4gKiAvLyByZXN1bHRzIGluOiBbREVCVUddIEhlbGxvLCB3b3JsZCFcbiAqIC8vIG91dHB1dCBmcm9tIFwic3RyaW5nRm10XCIgaGFuZGxlci5cbiAqIC8vIDEwIEhlbGxvLCB3b3JsZCEsIGFyZzA6IDEsIGFyZzE6IHR3bywgYXJnMzogWzMsIDQsIDVdIC8vIG91dHB1dCBmcm9tIFwiZnVuY3Rpb25GbXRcIiBmb3JtYXR0ZXIuXG4gKlxuICogLy8gY2FsbGluZzpcbiAqIGxvZy5nZXRMb2dnZXIoXCJkYXRhTG9nZ2VyXCIpLmVycm9yKFwib2ggbm8hXCIpO1xuICogLy8gcmVzdWx0cyBpbjpcbiAqIC8vIFtkYXRhTG9nZ2VyXSAtIEVSUk9SIG9oIG5vISAvLyBvdXRwdXQgZnJvbSBhbm90aGVyRm10IGhhbmRsZXIuXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogSW5saW5lIExvZ2dpbmdcbiAqIGBgYHRzXG4gKiBpbXBvcnQgKiBhcyBsb2dnZXIgZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbG9nL21vZC50c1wiO1xuICpcbiAqIGNvbnN0IHN0cmluZ0RhdGE6IHN0cmluZyA9IGxvZ2dlci5kZWJ1ZyhcImhlbGxvIHdvcmxkXCIpO1xuICogY29uc3QgYm9vbGVhbkRhdGE6IGJvb2xlYW4gPSBsb2dnZXIuZGVidWcodHJ1ZSwgMSwgXCJhYmNcIik7XG4gKiBjb25zdCBmbiA9ICgpOiBudW1iZXIgPT4ge1xuICogICByZXR1cm4gMTIzO1xuICogfTtcbiAqIGNvbnN0IHJlc29sdmVkRnVuY3Rpb25EYXRhOiBudW1iZXIgPSBsb2dnZXIuZGVidWcoZm4oKSk7XG4gKiBjb25zb2xlLmxvZyhzdHJpbmdEYXRhKTsgLy8gJ2hlbGxvIHdvcmxkJ1xuICogY29uc29sZS5sb2coYm9vbGVhbkRhdGEpOyAvLyB0cnVlXG4gKiBjb25zb2xlLmxvZyhyZXNvbHZlZEZ1bmN0aW9uRGF0YSk7IC8vIDEyM1xuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIExhenkgTG9nIEV2YWx1YXRpb25cbiAqIGBgYHRzXG4gKiBpbXBvcnQgKiBhcyBsb2cgZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbG9nL21vZC50c1wiO1xuICpcbiAqIGxvZy5zZXR1cCh7XG4gKiAgIGhhbmRsZXJzOiB7XG4gKiAgICAgY29uc29sZTogbmV3IGxvZy5oYW5kbGVycy5Db25zb2xlSGFuZGxlcihcIkRFQlVHXCIpLFxuICogICB9LFxuICpcbiAqICAgbG9nZ2Vyczoge1xuICogICAgIHRhc2tzOiB7XG4gKiAgICAgICBsZXZlbDogXCJFUlJPUlwiLFxuICogICAgICAgaGFuZGxlcnM6IFtcImNvbnNvbGVcIl0sXG4gKiAgICAgfSxcbiAqICAgfSxcbiAqIH0pO1xuICpcbiAqIGZ1bmN0aW9uIHNvbWVFeHBlbnNpdmVGbihudW06IG51bWJlciwgYm9vbDogYm9vbGVhbikge1xuICogICAvLyBkbyBzb21lIGV4cGVuc2l2ZSBjb21wdXRhdGlvblxuICogfVxuICpcbiAqIC8vIG5vdCBsb2dnZWQsIGFzIGRlYnVnIDwgZXJyb3IuXG4gKiBjb25zdCBkYXRhID0gbG9nLmRlYnVnKCgpID0+IHNvbWVFeHBlbnNpdmVGbig1LCB0cnVlKSk7XG4gKiBjb25zb2xlLmxvZyhkYXRhKTsgLy8gdW5kZWZpbmVkXG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEdlbmVyaWNGdW5jdGlvbiB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuaW1wb3J0IHtcbiAgQmFzZUhhbmRsZXIsXG4gIENvbnNvbGVIYW5kbGVyLFxuICBGaWxlSGFuZGxlcixcbiAgUm90YXRpbmdGaWxlSGFuZGxlcixcbiAgV3JpdGVySGFuZGxlcixcbn0gZnJvbSBcIi4vaGFuZGxlcnMudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9hc3NlcnQvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IExldmVsTmFtZSB9IGZyb20gXCIuL2xldmVscy50c1wiO1xuXG5leHBvcnQgeyBMb2dMZXZlbHMgfSBmcm9tIFwiLi9sZXZlbHMudHNcIjtcbmV4cG9ydCB0eXBlIHsgTGV2ZWxOYW1lIH0gZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5leHBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcbmV4cG9ydCB0eXBlIHsgTG9nUmVjb3JkIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5leHBvcnQgdHlwZSB7IEZvcm1hdHRlckZ1bmN0aW9uLCBIYW5kbGVyT3B0aW9ucywgTG9nTW9kZSB9IGZyb20gXCIuL2hhbmRsZXJzLnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXJDb25maWcge1xuICBsZXZlbD86IExldmVsTmFtZTtcbiAgaGFuZGxlcnM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2dDb25maWcge1xuICBoYW5kbGVycz86IHtcbiAgICBbbmFtZTogc3RyaW5nXTogQmFzZUhhbmRsZXI7XG4gIH07XG4gIGxvZ2dlcnM/OiB7XG4gICAgW25hbWU6IHN0cmluZ106IExvZ2dlckNvbmZpZztcbiAgfTtcbn1cblxuY29uc3QgREVGQVVMVF9MRVZFTCA9IFwiSU5GT1wiO1xuY29uc3QgREVGQVVMVF9DT05GSUc6IExvZ0NvbmZpZyA9IHtcbiAgaGFuZGxlcnM6IHtcbiAgICBkZWZhdWx0OiBuZXcgQ29uc29sZUhhbmRsZXIoREVGQVVMVF9MRVZFTCksXG4gIH0sXG5cbiAgbG9nZ2Vyczoge1xuICAgIGRlZmF1bHQ6IHtcbiAgICAgIGxldmVsOiBERUZBVUxUX0xFVkVMLFxuICAgICAgaGFuZGxlcnM6IFtcImRlZmF1bHRcIl0sXG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IHN0YXRlID0ge1xuICBoYW5kbGVyczogbmV3IE1hcDxzdHJpbmcsIEJhc2VIYW5kbGVyPigpLFxuICBsb2dnZXJzOiBuZXcgTWFwPHN0cmluZywgTG9nZ2VyPigpLFxuICBjb25maWc6IERFRkFVTFRfQ09ORklHLFxufTtcblxuLyoqXG4gKiBIYW5kbGVycyBhcmUgcmVzcG9uc2libGUgZm9yIGFjdHVhbCBvdXRwdXQgb2YgbG9nIG1lc3NhZ2VzLiBXaGVuIGEgaGFuZGxlciBpc1xuICogY2FsbGVkIGJ5IGEgbG9nZ2VyLCBpdCBmaXJzdGx5IGNoZWNrcyB0aGF0IHtAbGlua2NvZGUgTG9nUmVjb3JkfSdzIGxldmVsIGlzXG4gKiBub3QgbG93ZXIgdGhhbiBsZXZlbCBvZiB0aGUgaGFuZGxlci4gSWYgbGV2ZWwgY2hlY2sgcGFzc2VzLCBoYW5kbGVycyBmb3JtYXRzXG4gKiBsb2cgcmVjb3JkIGludG8gc3RyaW5nIGFuZCBvdXRwdXRzIGl0IHRvIHRhcmdldC5cbiAqXG4gKiAjIyBDdXN0b20gaGFuZGxlcnNcbiAqXG4gKiBDdXN0b20gaGFuZGxlcnMgY2FuIGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzaW5nIHtAbGlua2NvZGUgQmFzZUhhbmRsZXJ9IG9yXG4gKiB7QGxpbmtjb2RlIFdyaXRlckhhbmRsZXJ9LlxuICpcbiAqIHtAbGlua2NvZGUgQmFzZUhhbmRsZXJ9IGlzIGJhcmUtYm9uZXMgaGFuZGxlciB0aGF0IGhhcyBubyBvdXRwdXQgbG9naWMgYXQgYWxsLFxuICpcbiAqIHtAbGlua2NvZGUgV3JpdGVySGFuZGxlcn0gaXMgYW4gYWJzdHJhY3QgY2xhc3MgdGhhdCBzdXBwb3J0cyBhbnkgdGFyZ2V0IHdpdGhcbiAqIGBXcml0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBEdXJpbmcgc2V0dXAgYXN5bmMgaG9va3MgYHNldHVwYCBhbmQgYGRlc3Ryb3lgIGFyZSBjYWxsZWQsIHlvdSBjYW4gdXNlIHRoZW1cbiAqIHRvIG9wZW4gYW5kIGNsb3NlIGZpbGUvSFRUUCBjb25uZWN0aW9uIG9yIGFueSBvdGhlciBhY3Rpb24geW91IG1pZ2h0IG5lZWQuXG4gKlxuICogRm9yIGV4YW1wbGVzIGNoZWNrIHNvdXJjZSBjb2RlIG9mIHtAbGlua2NvZGUgRmlsZUhhbmRsZXJ9YFxuICogYW5kIHtAbGlua2NvZGUgVGVzdEhhbmRsZXJ9LlxuICovXG5leHBvcnQgY29uc3QgaGFuZGxlcnMgPSB7XG4gIEJhc2VIYW5kbGVyLFxuICBDb25zb2xlSGFuZGxlcixcbiAgV3JpdGVySGFuZGxlcixcbiAgRmlsZUhhbmRsZXIsXG4gIFJvdGF0aW5nRmlsZUhhbmRsZXIsXG59O1xuXG4vKiogR2V0IGEgbG9nZ2VyIGluc3RhbmNlLiBJZiBub3Qgc3BlY2lmaWVkIGBuYW1lYCwgZ2V0IHRoZSBkZWZhdWx0IGxvZ2dlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2dnZXIobmFtZT86IHN0cmluZyk6IExvZ2dlciB7XG4gIGlmICghbmFtZSkge1xuICAgIGNvbnN0IGQgPSBzdGF0ZS5sb2dnZXJzLmdldChcImRlZmF1bHRcIik7XG4gICAgYXNzZXJ0KFxuICAgICAgZCAhPT0gdW5kZWZpbmVkLFxuICAgICAgYFwiZGVmYXVsdFwiIGxvZ2dlciBtdXN0IGJlIHNldCBmb3IgZ2V0dGluZyBsb2dnZXIgd2l0aG91dCBuYW1lYCxcbiAgICApO1xuICAgIHJldHVybiBkO1xuICB9XG4gIGNvbnN0IHJlc3VsdCA9IHN0YXRlLmxvZ2dlcnMuZ2V0KG5hbWUpO1xuICBpZiAoIXJlc3VsdCkge1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIobmFtZSwgXCJOT1RTRVRcIiwgeyBoYW5kbGVyczogW10gfSk7XG4gICAgc3RhdGUubG9nZ2Vycy5zZXQobmFtZSwgbG9nZ2VyKTtcbiAgICByZXR1cm4gbG9nZ2VyO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBMb2cgd2l0aCBkZWJ1ZyBsZXZlbCwgdXNpbmcgZGVmYXVsdCBsb2dnZXIuICovXG5leHBvcnQgZnVuY3Rpb24gZGVidWc8VD4obXNnOiAoKSA9PiBULCAuLi5hcmdzOiB1bmtub3duW10pOiBUIHwgdW5kZWZpbmVkO1xuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnPFQ+KFxuICBtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkZWJ1ZzxUPihcbiAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIC8vIEFzc2lzdCBUUyBjb21waWxlciB3aXRoIHBhc3MtdGhyb3VnaCBnZW5lcmljIHR5cGVcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuZGVidWcobXNnLCAuLi5hcmdzKTtcbiAgfVxuICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5kZWJ1Zyhtc2csIC4uLmFyZ3MpO1xufVxuXG4vKiogTG9nIHdpdGggaW5mbyBsZXZlbCwgdXNpbmcgZGVmYXVsdCBsb2dnZXIuICovXG5leHBvcnQgZnVuY3Rpb24gaW5mbzxUPihtc2c6ICgpID0+IFQsIC4uLmFyZ3M6IHVua25vd25bXSk6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gaW5mbzxUPihcbiAgbXNnOiBUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBULFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gaW5mbzxUPihcbiAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIC8vIEFzc2lzdCBUUyBjb21waWxlciB3aXRoIHBhc3MtdGhyb3VnaCBnZW5lcmljIHR5cGVcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuaW5mbyhtc2csIC4uLmFyZ3MpO1xuICB9XG4gIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmluZm8obXNnLCAuLi5hcmdzKTtcbn1cblxuLyoqIExvZyB3aXRoIHdhcm5pbmcgbGV2ZWwsIHVzaW5nIGRlZmF1bHQgbG9nZ2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdhcm5pbmc8VD4obXNnOiAoKSA9PiBULCAuLi5hcmdzOiB1bmtub3duW10pOiBUIHwgdW5kZWZpbmVkO1xuZXhwb3J0IGZ1bmN0aW9uIHdhcm5pbmc8VD4oXG4gIG1zZzogVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCxcbiAgLi4uYXJnczogdW5rbm93bltdXG4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIHdhcm5pbmc8VD4oXG4gIG1zZzogKFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQpIHwgKCgpID0+IFQpLFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQgfCB1bmRlZmluZWQge1xuICAvLyBBc3Npc3QgVFMgY29tcGlsZXIgd2l0aCBwYXNzLXRocm91Z2ggZ2VuZXJpYyB0eXBlXG4gIGlmIChtc2cgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLndhcm5pbmcobXNnLCAuLi5hcmdzKTtcbiAgfVxuICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS53YXJuaW5nKG1zZywgLi4uYXJncyk7XG59XG5cbi8qKiBMb2cgd2l0aCBlcnJvciBsZXZlbCwgdXNpbmcgZGVmYXVsdCBsb2dnZXIuICovXG5leHBvcnQgZnVuY3Rpb24gZXJyb3I8VD4obXNnOiAoKSA9PiBULCAuLi5hcmdzOiB1bmtub3duW10pOiBUIHwgdW5kZWZpbmVkO1xuZXhwb3J0IGZ1bmN0aW9uIGVycm9yPFQ+KFxuICBtc2c6IFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQsXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBlcnJvcjxUPihcbiAgbXNnOiAoVCBleHRlbmRzIEdlbmVyaWNGdW5jdGlvbiA/IG5ldmVyIDogVCkgfCAoKCkgPT4gVCksXG4gIC4uLmFyZ3M6IHVua25vd25bXVxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIC8vIEFzc2lzdCBUUyBjb21waWxlciB3aXRoIHBhc3MtdGhyb3VnaCBnZW5lcmljIHR5cGVcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuZXJyb3IobXNnLCAuLi5hcmdzKTtcbiAgfVxuICByZXR1cm4gZ2V0TG9nZ2VyKFwiZGVmYXVsdFwiKS5lcnJvcihtc2csIC4uLmFyZ3MpO1xufVxuXG4vKiogTG9nIHdpdGggY3JpdGljYWwgbGV2ZWwsIHVzaW5nIGRlZmF1bHQgbG9nZ2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyaXRpY2FsPFQ+KG1zZzogKCkgPT4gVCwgLi4uYXJnczogdW5rbm93bltdKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBjcml0aWNhbDxUPihcbiAgbXNnOiBUIGV4dGVuZHMgR2VuZXJpY0Z1bmN0aW9uID8gbmV2ZXIgOiBULFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gY3JpdGljYWw8VD4oXG4gIG1zZzogKFQgZXh0ZW5kcyBHZW5lcmljRnVuY3Rpb24gPyBuZXZlciA6IFQpIHwgKCgpID0+IFQpLFxuICAuLi5hcmdzOiB1bmtub3duW11cbik6IFQgfCB1bmRlZmluZWQge1xuICAvLyBBc3Npc3QgVFMgY29tcGlsZXIgd2l0aCBwYXNzLXRocm91Z2ggZ2VuZXJpYyB0eXBlXG4gIGlmIChtc2cgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBnZXRMb2dnZXIoXCJkZWZhdWx0XCIpLmNyaXRpY2FsKG1zZywgLi4uYXJncyk7XG4gIH1cbiAgcmV0dXJuIGdldExvZ2dlcihcImRlZmF1bHRcIikuY3JpdGljYWwobXNnLCAuLi5hcmdzKTtcbn1cblxuLyoqIFNldHVwIGxvZ2dlciBjb25maWcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dXAoY29uZmlnOiBMb2dDb25maWcpIHtcbiAgc3RhdGUuY29uZmlnID0ge1xuICAgIGhhbmRsZXJzOiB7IC4uLkRFRkFVTFRfQ09ORklHLmhhbmRsZXJzLCAuLi5jb25maWcuaGFuZGxlcnMgfSxcbiAgICBsb2dnZXJzOiB7IC4uLkRFRkFVTFRfQ09ORklHLmxvZ2dlcnMsIC4uLmNvbmZpZy5sb2dnZXJzIH0sXG4gIH07XG5cbiAgLy8gdGVhciBkb3duIGV4aXN0aW5nIGhhbmRsZXJzXG4gIHN0YXRlLmhhbmRsZXJzLmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICBoYW5kbGVyLmRlc3Ryb3koKTtcbiAgfSk7XG4gIHN0YXRlLmhhbmRsZXJzLmNsZWFyKCk7XG5cbiAgLy8gc2V0dXAgaGFuZGxlcnNcbiAgY29uc3QgaGFuZGxlcnMgPSBzdGF0ZS5jb25maWcuaGFuZGxlcnMgfHwge307XG5cbiAgZm9yIChjb25zdCBoYW5kbGVyTmFtZSBpbiBoYW5kbGVycykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSBoYW5kbGVyc1toYW5kbGVyTmFtZV07XG4gICAgaGFuZGxlci5zZXR1cCgpO1xuICAgIHN0YXRlLmhhbmRsZXJzLnNldChoYW5kbGVyTmFtZSwgaGFuZGxlcik7XG4gIH1cblxuICAvLyByZW1vdmUgZXhpc3RpbmcgbG9nZ2Vyc1xuICBzdGF0ZS5sb2dnZXJzLmNsZWFyKCk7XG5cbiAgLy8gc2V0dXAgbG9nZ2Vyc1xuICBjb25zdCBsb2dnZXJzID0gc3RhdGUuY29uZmlnLmxvZ2dlcnMgfHwge307XG4gIGZvciAoY29uc3QgbG9nZ2VyTmFtZSBpbiBsb2dnZXJzKSB7XG4gICAgY29uc3QgbG9nZ2VyQ29uZmlnID0gbG9nZ2Vyc1tsb2dnZXJOYW1lXTtcbiAgICBjb25zdCBoYW5kbGVyTmFtZXMgPSBsb2dnZXJDb25maWcuaGFuZGxlcnMgfHwgW107XG4gICAgY29uc3QgaGFuZGxlcnM6IEJhc2VIYW5kbGVyW10gPSBbXTtcblxuICAgIGhhbmRsZXJOYW1lcy5mb3JFYWNoKChoYW5kbGVyTmFtZSkgPT4ge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHN0YXRlLmhhbmRsZXJzLmdldChoYW5kbGVyTmFtZSk7XG4gICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICBoYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgbGV2ZWxOYW1lID0gbG9nZ2VyQ29uZmlnLmxldmVsIHx8IERFRkFVTFRfTEVWRUw7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcihsb2dnZXJOYW1lLCBsZXZlbE5hbWUsIHsgaGFuZGxlcnM6IGhhbmRsZXJzIH0pO1xuICAgIHN0YXRlLmxvZ2dlcnMuc2V0KGxvZ2dlck5hbWUsIGxvZ2dlcik7XG4gIH1cbn1cblxuc2V0dXAoREVGQVVMVF9DT05GSUcpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3UEMsR0FFRCxTQUFTLE1BQU0sUUFBUSxjQUFjO0FBRXJDLFNBQ0UsV0FBVyxFQUNYLGNBQWMsRUFDZCxXQUFXLEVBQ1gsbUJBQW1CLEVBQ25CLGFBQWEsUUFDUixnQkFBZ0I7QUFDdkIsU0FBUyxNQUFNLFFBQVEsc0JBQXNCO0FBRzdDLFNBQVMsU0FBUyxRQUFRLGNBQWM7QUFFeEMsU0FBUyxNQUFNLFFBQVEsY0FBYztBQUlyQyxPQUFPLE1BQU07RUFDWCxNQUFrQjtFQUNsQixT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