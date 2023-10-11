// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { getLevelByName, LogLevels } from "./levels.ts";
import { blue, bold, red, yellow } from "../fmt/colors.ts";
import { existsSync } from "../fs/exists.ts";
import { BufWriterSync } from "../io/buf_writer.ts";
const DEFAULT_FORMATTER = "{levelName} {msg}";
export class BaseHandler {
  level;
  levelName;
  formatter;
  constructor(levelName, options = {}){
    this.level = getLevelByName(levelName);
    this.levelName = levelName;
    this.formatter = options.formatter || DEFAULT_FORMATTER;
  }
  handle(logRecord) {
    if (this.level > logRecord.level) return;
    const msg = this.format(logRecord);
    return this.log(msg);
  }
  format(logRecord) {
    if (this.formatter instanceof Function) {
      return this.formatter(logRecord);
    }
    return this.formatter.replace(/{([^\s}]+)}/g, (match, p1)=>{
      const value = logRecord[p1];
      // do not interpolate missing values
      if (value === undefined) {
        return match;
      }
      return String(value);
    });
  }
  log(_msg) {}
  setup() {}
  destroy() {}
}
/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */ export class ConsoleHandler extends BaseHandler {
  format(logRecord) {
    let msg = super.format(logRecord);
    switch(logRecord.level){
      case LogLevels.INFO:
        msg = blue(msg);
        break;
      case LogLevels.WARNING:
        msg = yellow(msg);
        break;
      case LogLevels.ERROR:
        msg = red(msg);
        break;
      case LogLevels.CRITICAL:
        msg = bold(red(msg));
        break;
      default:
        break;
    }
    return msg;
  }
  log(msg) {
    console.log(msg);
  }
}
export class WriterHandler extends BaseHandler {
  _writer;
  #encoder = new TextEncoder();
}
/**
 * This handler will output to a file using an optional mode (default is `a`,
 * e.g. append). The file will grow indefinitely. It uses a buffer for writing
 * to file. Logs can be manually flushed with `fileHandler.flush()`. Log
 * messages with a log level greater than error are immediately flushed. Logs
 * are also flushed on process completion.
 *
 * Behavior of the log modes is as follows:
 *
 * - `'a'` - Default mode. Appends new log messages to the end of an existing log
 *   file, or create a new log file if none exists.
 * - `'w'` - Upon creation of the handler, any existing log file will be removed
 *   and a new one created.
 * - `'x'` - This will create a new log file and throw an error if one already
 *   exists.
 *
 * This handler requires `--allow-write` permission on the log file.
 */ export class FileHandler extends WriterHandler {
  _file;
  _buf;
  _filename;
  _mode;
  _openOptions;
  _encoder = new TextEncoder();
  #unloadCallback = (()=>{
    this.destroy();
  }).bind(this);
  constructor(levelName, options){
    super(levelName, options);
    this._filename = options.filename;
    // default to append mode, write only
    this._mode = options.mode ? options.mode : "a";
    this._openOptions = {
      createNew: this._mode === "x",
      create: this._mode !== "x",
      append: this._mode === "a",
      truncate: this._mode !== "a",
      write: true
    };
  }
  setup() {
    this._file = Deno.openSync(this._filename, this._openOptions);
    this._writer = this._file;
    this._buf = new BufWriterSync(this._file);
    addEventListener("unload", this.#unloadCallback);
  }
  handle(logRecord) {
    super.handle(logRecord);
    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }
  log(msg) {
    if (this._encoder.encode(msg).byteLength + 1 > this._buf.available()) {
      this.flush();
    }
    this._buf.writeSync(this._encoder.encode(msg + "\n"));
  }
  flush() {
    if (this._buf?.buffered() > 0) {
      this._buf.flush();
    }
  }
  destroy() {
    this.flush();
    this._file?.close();
    this._file = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }
}
/**
 * This handler extends the functionality of the {@linkcode FileHandler} by
 * "rotating" the log file when it reaches a certain size. `maxBytes` specifies
 * the maximum size in bytes that the log file can grow to before rolling over
 * to a new one. If the size of the new log message plus the current log file
 * size exceeds `maxBytes` then a roll-over is triggered. When a roll-over
 * occurs, before the log message is written, the log file is renamed and
 * appended with `.1`. If a `.1` version already existed, it would have been
 * renamed `.2` first and so on. The maximum number of log files to keep is
 * specified by `maxBackupCount`. After the renames are complete the log message
 * is written to the original, now blank, file.
 *
 * Example: Given `log.txt`, `log.txt.1`, `log.txt.2` and `log.txt.3`, a
 * `maxBackupCount` of 3 and a new log message which would cause `log.txt` to
 * exceed `maxBytes`, then `log.txt.2` would be renamed to `log.txt.3` (thereby
 * discarding the original contents of `log.txt.3` since 3 is the maximum number
 * of backups to keep), `log.txt.1` would be renamed to `log.txt.2`, `log.txt`
 * would be renamed to `log.txt.1` and finally `log.txt` would be created from
 * scratch where the new log message would be written.
 *
 * This handler uses a buffer for writing log messages to file. Logs can be
 * manually flushed with `fileHandler.flush()`. Log messages with a log level
 * greater than ERROR are immediately flushed. Logs are also flushed on process
 * completion.
 *
 * Additional notes on `mode` as described above:
 *
 * - `'a'` Default mode. As above, this will pick up where the logs left off in
 *   rotation, or create a new log file if it doesn't exist.
 * - `'w'` in addition to starting with a clean `filename`, this mode will also
 *   cause any existing backups (up to `maxBackupCount`) to be deleted on setup
 *   giving a fully clean slate.
 * - `'x'` requires that neither `filename`, nor any backups (up to
 *   `maxBackupCount`), exist before setup.
 *
 * This handler requires both `--allow-read` and `--allow-write` permissions on
 * the log files.
 */ export class RotatingFileHandler extends FileHandler {
  #maxBytes;
  #maxBackupCount;
  #currentFileSize = 0;
  constructor(levelName, options){
    super(levelName, options);
    this.#maxBytes = options.maxBytes;
    this.#maxBackupCount = options.maxBackupCount;
  }
  setup() {
    if (this.#maxBytes < 1) {
      this.destroy();
      throw new Error("maxBytes cannot be less than 1");
    }
    if (this.#maxBackupCount < 1) {
      this.destroy();
      throw new Error("maxBackupCount cannot be less than 1");
    }
    super.setup();
    if (this._mode === "w") {
      // Remove old backups too as it doesn't make sense to start with a clean
      // log file, but old backups
      for(let i = 1; i <= this.#maxBackupCount; i++){
        try {
          Deno.removeSync(this._filename + "." + i);
        } catch (error) {
          if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
          }
        }
      }
    } else if (this._mode === "x") {
      // Throw if any backups also exist
      for(let i = 1; i <= this.#maxBackupCount; i++){
        if (existsSync(this._filename + "." + i)) {
          this.destroy();
          throw new Deno.errors.AlreadyExists("Backup log file " + this._filename + "." + i + " already exists");
        }
      }
    } else {
      this.#currentFileSize = Deno.statSync(this._filename).size;
    }
  }
  log(msg) {
    const msgByteLength = this._encoder.encode(msg).byteLength + 1;
    if (this.#currentFileSize + msgByteLength > this.#maxBytes) {
      this.rotateLogFiles();
      this.#currentFileSize = 0;
    }
    super.log(msg);
    this.#currentFileSize += msgByteLength;
  }
  rotateLogFiles() {
    this._buf.flush();
    this._file.close();
    for(let i = this.#maxBackupCount - 1; i >= 0; i--){
      const source = this._filename + (i === 0 ? "" : "." + i);
      const dest = this._filename + "." + (i + 1);
      if (existsSync(source)) {
        Deno.renameSync(source, dest);
      }
    }
    this._file = Deno.openSync(this._filename, this._openOptions);
    this._writer = this._file;
    this._buf = new BufWriterSync(this._file);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2xvZy9oYW5kbGVycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgZ2V0TGV2ZWxCeU5hbWUsIExldmVsTmFtZSwgTG9nTGV2ZWxzIH0gZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IExvZ1JlY29yZCB9IGZyb20gXCIuL2xvZ2dlci50c1wiO1xuaW1wb3J0IHsgYmx1ZSwgYm9sZCwgcmVkLCB5ZWxsb3cgfSBmcm9tIFwiLi4vZm10L2NvbG9ycy50c1wiO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCIuLi9mcy9leGlzdHMudHNcIjtcbmltcG9ydCB7IEJ1ZldyaXRlclN5bmMgfSBmcm9tIFwiLi4vaW8vYnVmX3dyaXRlci50c1wiO1xuaW1wb3J0IHR5cGUgeyBXcml0ZXIgfSBmcm9tIFwiLi4vdHlwZXMuZC50c1wiO1xuXG5jb25zdCBERUZBVUxUX0ZPUk1BVFRFUiA9IFwie2xldmVsTmFtZX0ge21zZ31cIjtcbmV4cG9ydCB0eXBlIEZvcm1hdHRlckZ1bmN0aW9uID0gKGxvZ1JlY29yZDogTG9nUmVjb3JkKSA9PiBzdHJpbmc7XG5leHBvcnQgdHlwZSBMb2dNb2RlID0gXCJhXCIgfCBcIndcIiB8IFwieFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEhhbmRsZXJPcHRpb25zIHtcbiAgZm9ybWF0dGVyPzogc3RyaW5nIHwgRm9ybWF0dGVyRnVuY3Rpb247XG59XG5cbmV4cG9ydCBjbGFzcyBCYXNlSGFuZGxlciB7XG4gIGxldmVsOiBudW1iZXI7XG4gIGxldmVsTmFtZTogTGV2ZWxOYW1lO1xuICBmb3JtYXR0ZXI6IHN0cmluZyB8IEZvcm1hdHRlckZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsTmFtZTogTGV2ZWxOYW1lLCBvcHRpb25zOiBIYW5kbGVyT3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sZXZlbCA9IGdldExldmVsQnlOYW1lKGxldmVsTmFtZSk7XG4gICAgdGhpcy5sZXZlbE5hbWUgPSBsZXZlbE5hbWU7XG5cbiAgICB0aGlzLmZvcm1hdHRlciA9IG9wdGlvbnMuZm9ybWF0dGVyIHx8IERFRkFVTFRfRk9STUFUVEVSO1xuICB9XG5cbiAgaGFuZGxlKGxvZ1JlY29yZDogTG9nUmVjb3JkKSB7XG4gICAgaWYgKHRoaXMubGV2ZWwgPiBsb2dSZWNvcmQubGV2ZWwpIHJldHVybjtcblxuICAgIGNvbnN0IG1zZyA9IHRoaXMuZm9ybWF0KGxvZ1JlY29yZCk7XG4gICAgcmV0dXJuIHRoaXMubG9nKG1zZyk7XG4gIH1cblxuICBmb3JtYXQobG9nUmVjb3JkOiBMb2dSZWNvcmQpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmZvcm1hdHRlciBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5mb3JtYXR0ZXIobG9nUmVjb3JkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5mb3JtYXR0ZXIucmVwbGFjZSgveyhbXlxcc31dKyl9L2csIChtYXRjaCwgcDEpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBsb2dSZWNvcmRbcDEgYXMga2V5b2YgTG9nUmVjb3JkXTtcblxuICAgICAgLy8gZG8gbm90IGludGVycG9sYXRlIG1pc3NpbmcgdmFsdWVzXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgIH0pO1xuICB9XG5cbiAgbG9nKF9tc2c6IHN0cmluZykge31cbiAgc2V0dXAoKSB7fVxuICBkZXN0cm95KCkge31cbn1cblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBkZWZhdWx0IGxvZ2dlci4gSXQgd2lsbCBvdXRwdXQgY29sb3IgY29kZWQgbG9nIG1lc3NhZ2VzIHRvIHRoZVxuICogY29uc29sZSB2aWEgYGNvbnNvbGUubG9nKClgLlxuICovXG5leHBvcnQgY2xhc3MgQ29uc29sZUhhbmRsZXIgZXh0ZW5kcyBCYXNlSGFuZGxlciB7XG4gIG92ZXJyaWRlIGZvcm1hdChsb2dSZWNvcmQ6IExvZ1JlY29yZCk6IHN0cmluZyB7XG4gICAgbGV0IG1zZyA9IHN1cGVyLmZvcm1hdChsb2dSZWNvcmQpO1xuXG4gICAgc3dpdGNoIChsb2dSZWNvcmQubGV2ZWwpIHtcbiAgICAgIGNhc2UgTG9nTGV2ZWxzLklORk86XG4gICAgICAgIG1zZyA9IGJsdWUobXNnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIExvZ0xldmVscy5XQVJOSU5HOlxuICAgICAgICBtc2cgPSB5ZWxsb3cobXNnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIExvZ0xldmVscy5FUlJPUjpcbiAgICAgICAgbXNnID0gcmVkKG1zZyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBMb2dMZXZlbHMuQ1JJVElDQUw6XG4gICAgICAgIG1zZyA9IGJvbGQocmVkKG1zZykpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBtc2c7XG4gIH1cblxuICBvdmVycmlkZSBsb2cobXNnOiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLmxvZyhtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBXcml0ZXJIYW5kbGVyIGV4dGVuZHMgQmFzZUhhbmRsZXIge1xuICBwcm90ZWN0ZWQgX3dyaXRlciE6IFdyaXRlcjtcbiAgI2VuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuICBhYnN0cmFjdCBvdmVycmlkZSBsb2cobXNnOiBzdHJpbmcpOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgRmlsZUhhbmRsZXJPcHRpb25zIGV4dGVuZHMgSGFuZGxlck9wdGlvbnMge1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBtb2RlPzogTG9nTW9kZTtcbn1cblxuLyoqXG4gKiBUaGlzIGhhbmRsZXIgd2lsbCBvdXRwdXQgdG8gYSBmaWxlIHVzaW5nIGFuIG9wdGlvbmFsIG1vZGUgKGRlZmF1bHQgaXMgYGFgLFxuICogZS5nLiBhcHBlbmQpLiBUaGUgZmlsZSB3aWxsIGdyb3cgaW5kZWZpbml0ZWx5LiBJdCB1c2VzIGEgYnVmZmVyIGZvciB3cml0aW5nXG4gKiB0byBmaWxlLiBMb2dzIGNhbiBiZSBtYW51YWxseSBmbHVzaGVkIHdpdGggYGZpbGVIYW5kbGVyLmZsdXNoKClgLiBMb2dcbiAqIG1lc3NhZ2VzIHdpdGggYSBsb2cgbGV2ZWwgZ3JlYXRlciB0aGFuIGVycm9yIGFyZSBpbW1lZGlhdGVseSBmbHVzaGVkLiBMb2dzXG4gKiBhcmUgYWxzbyBmbHVzaGVkIG9uIHByb2Nlc3MgY29tcGxldGlvbi5cbiAqXG4gKiBCZWhhdmlvciBvZiB0aGUgbG9nIG1vZGVzIGlzIGFzIGZvbGxvd3M6XG4gKlxuICogLSBgJ2EnYCAtIERlZmF1bHQgbW9kZS4gQXBwZW5kcyBuZXcgbG9nIG1lc3NhZ2VzIHRvIHRoZSBlbmQgb2YgYW4gZXhpc3RpbmcgbG9nXG4gKiAgIGZpbGUsIG9yIGNyZWF0ZSBhIG5ldyBsb2cgZmlsZSBpZiBub25lIGV4aXN0cy5cbiAqIC0gYCd3J2AgLSBVcG9uIGNyZWF0aW9uIG9mIHRoZSBoYW5kbGVyLCBhbnkgZXhpc3RpbmcgbG9nIGZpbGUgd2lsbCBiZSByZW1vdmVkXG4gKiAgIGFuZCBhIG5ldyBvbmUgY3JlYXRlZC5cbiAqIC0gYCd4J2AgLSBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGxvZyBmaWxlIGFuZCB0aHJvdyBhbiBlcnJvciBpZiBvbmUgYWxyZWFkeVxuICogICBleGlzdHMuXG4gKlxuICogVGhpcyBoYW5kbGVyIHJlcXVpcmVzIGAtLWFsbG93LXdyaXRlYCBwZXJtaXNzaW9uIG9uIHRoZSBsb2cgZmlsZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVIYW5kbGVyIGV4dGVuZHMgV3JpdGVySGFuZGxlciB7XG4gIHByb3RlY3RlZCBfZmlsZTogRGVuby5Gc0ZpbGUgfCB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCBfYnVmITogQnVmV3JpdGVyU3luYztcbiAgcHJvdGVjdGVkIF9maWxlbmFtZTogc3RyaW5nO1xuICBwcm90ZWN0ZWQgX21vZGU6IExvZ01vZGU7XG4gIHByb3RlY3RlZCBfb3Blbk9wdGlvbnM6IERlbm8uT3Blbk9wdGlvbnM7XG4gIHByb3RlY3RlZCBfZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAjdW5sb2FkQ2FsbGJhY2sgPSAoKCkgPT4ge1xuICAgIHRoaXMuZGVzdHJveSgpO1xuICB9KS5iaW5kKHRoaXMpO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsTmFtZTogTGV2ZWxOYW1lLCBvcHRpb25zOiBGaWxlSGFuZGxlck9wdGlvbnMpIHtcbiAgICBzdXBlcihsZXZlbE5hbWUsIG9wdGlvbnMpO1xuICAgIHRoaXMuX2ZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZTtcbiAgICAvLyBkZWZhdWx0IHRvIGFwcGVuZCBtb2RlLCB3cml0ZSBvbmx5XG4gICAgdGhpcy5fbW9kZSA9IG9wdGlvbnMubW9kZSA/IG9wdGlvbnMubW9kZSA6IFwiYVwiO1xuICAgIHRoaXMuX29wZW5PcHRpb25zID0ge1xuICAgICAgY3JlYXRlTmV3OiB0aGlzLl9tb2RlID09PSBcInhcIixcbiAgICAgIGNyZWF0ZTogdGhpcy5fbW9kZSAhPT0gXCJ4XCIsXG4gICAgICBhcHBlbmQ6IHRoaXMuX21vZGUgPT09IFwiYVwiLFxuICAgICAgdHJ1bmNhdGU6IHRoaXMuX21vZGUgIT09IFwiYVwiLFxuICAgICAgd3JpdGU6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldHVwKCkge1xuICAgIHRoaXMuX2ZpbGUgPSBEZW5vLm9wZW5TeW5jKHRoaXMuX2ZpbGVuYW1lLCB0aGlzLl9vcGVuT3B0aW9ucyk7XG4gICAgdGhpcy5fd3JpdGVyID0gdGhpcy5fZmlsZTtcbiAgICB0aGlzLl9idWYgPSBuZXcgQnVmV3JpdGVyU3luYyh0aGlzLl9maWxlKTtcblxuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy4jdW5sb2FkQ2FsbGJhY2spO1xuICB9XG5cbiAgb3ZlcnJpZGUgaGFuZGxlKGxvZ1JlY29yZDogTG9nUmVjb3JkKSB7XG4gICAgc3VwZXIuaGFuZGxlKGxvZ1JlY29yZCk7XG5cbiAgICAvLyBJbW1lZGlhdGVseSBmbHVzaCBpZiBsb2cgbGV2ZWwgaXMgaGlnaGVyIHRoYW4gRVJST1JcbiAgICBpZiAobG9nUmVjb3JkLmxldmVsID4gTG9nTGV2ZWxzLkVSUk9SKSB7XG4gICAgICB0aGlzLmZsdXNoKCk7XG4gICAgfVxuICB9XG5cbiAgbG9nKG1zZzogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX2VuY29kZXIuZW5jb2RlKG1zZykuYnl0ZUxlbmd0aCArIDEgPiB0aGlzLl9idWYuYXZhaWxhYmxlKCkpIHtcbiAgICAgIHRoaXMuZmx1c2goKTtcbiAgICB9XG4gICAgdGhpcy5fYnVmLndyaXRlU3luYyh0aGlzLl9lbmNvZGVyLmVuY29kZShtc2cgKyBcIlxcblwiKSk7XG4gIH1cblxuICBmbHVzaCgpIHtcbiAgICBpZiAodGhpcy5fYnVmPy5idWZmZXJlZCgpID4gMCkge1xuICAgICAgdGhpcy5fYnVmLmZsdXNoKCk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpIHtcbiAgICB0aGlzLmZsdXNoKCk7XG4gICAgdGhpcy5fZmlsZT8uY2xvc2UoKTtcbiAgICB0aGlzLl9maWxlID0gdW5kZWZpbmVkO1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy4jdW5sb2FkQ2FsbGJhY2spO1xuICB9XG59XG5cbmludGVyZmFjZSBSb3RhdGluZ0ZpbGVIYW5kbGVyT3B0aW9ucyBleHRlbmRzIEZpbGVIYW5kbGVyT3B0aW9ucyB7XG4gIG1heEJ5dGVzOiBudW1iZXI7XG4gIG1heEJhY2t1cENvdW50OiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhpcyBoYW5kbGVyIGV4dGVuZHMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHtAbGlua2NvZGUgRmlsZUhhbmRsZXJ9IGJ5XG4gKiBcInJvdGF0aW5nXCIgdGhlIGxvZyBmaWxlIHdoZW4gaXQgcmVhY2hlcyBhIGNlcnRhaW4gc2l6ZS4gYG1heEJ5dGVzYCBzcGVjaWZpZXNcbiAqIHRoZSBtYXhpbXVtIHNpemUgaW4gYnl0ZXMgdGhhdCB0aGUgbG9nIGZpbGUgY2FuIGdyb3cgdG8gYmVmb3JlIHJvbGxpbmcgb3ZlclxuICogdG8gYSBuZXcgb25lLiBJZiB0aGUgc2l6ZSBvZiB0aGUgbmV3IGxvZyBtZXNzYWdlIHBsdXMgdGhlIGN1cnJlbnQgbG9nIGZpbGVcbiAqIHNpemUgZXhjZWVkcyBgbWF4Qnl0ZXNgIHRoZW4gYSByb2xsLW92ZXIgaXMgdHJpZ2dlcmVkLiBXaGVuIGEgcm9sbC1vdmVyXG4gKiBvY2N1cnMsIGJlZm9yZSB0aGUgbG9nIG1lc3NhZ2UgaXMgd3JpdHRlbiwgdGhlIGxvZyBmaWxlIGlzIHJlbmFtZWQgYW5kXG4gKiBhcHBlbmRlZCB3aXRoIGAuMWAuIElmIGEgYC4xYCB2ZXJzaW9uIGFscmVhZHkgZXhpc3RlZCwgaXQgd291bGQgaGF2ZSBiZWVuXG4gKiByZW5hbWVkIGAuMmAgZmlyc3QgYW5kIHNvIG9uLiBUaGUgbWF4aW11bSBudW1iZXIgb2YgbG9nIGZpbGVzIHRvIGtlZXAgaXNcbiAqIHNwZWNpZmllZCBieSBgbWF4QmFja3VwQ291bnRgLiBBZnRlciB0aGUgcmVuYW1lcyBhcmUgY29tcGxldGUgdGhlIGxvZyBtZXNzYWdlXG4gKiBpcyB3cml0dGVuIHRvIHRoZSBvcmlnaW5hbCwgbm93IGJsYW5rLCBmaWxlLlxuICpcbiAqIEV4YW1wbGU6IEdpdmVuIGBsb2cudHh0YCwgYGxvZy50eHQuMWAsIGBsb2cudHh0LjJgIGFuZCBgbG9nLnR4dC4zYCwgYVxuICogYG1heEJhY2t1cENvdW50YCBvZiAzIGFuZCBhIG5ldyBsb2cgbWVzc2FnZSB3aGljaCB3b3VsZCBjYXVzZSBgbG9nLnR4dGAgdG9cbiAqIGV4Y2VlZCBgbWF4Qnl0ZXNgLCB0aGVuIGBsb2cudHh0LjJgIHdvdWxkIGJlIHJlbmFtZWQgdG8gYGxvZy50eHQuM2AgKHRoZXJlYnlcbiAqIGRpc2NhcmRpbmcgdGhlIG9yaWdpbmFsIGNvbnRlbnRzIG9mIGBsb2cudHh0LjNgIHNpbmNlIDMgaXMgdGhlIG1heGltdW0gbnVtYmVyXG4gKiBvZiBiYWNrdXBzIHRvIGtlZXApLCBgbG9nLnR4dC4xYCB3b3VsZCBiZSByZW5hbWVkIHRvIGBsb2cudHh0LjJgLCBgbG9nLnR4dGBcbiAqIHdvdWxkIGJlIHJlbmFtZWQgdG8gYGxvZy50eHQuMWAgYW5kIGZpbmFsbHkgYGxvZy50eHRgIHdvdWxkIGJlIGNyZWF0ZWQgZnJvbVxuICogc2NyYXRjaCB3aGVyZSB0aGUgbmV3IGxvZyBtZXNzYWdlIHdvdWxkIGJlIHdyaXR0ZW4uXG4gKlxuICogVGhpcyBoYW5kbGVyIHVzZXMgYSBidWZmZXIgZm9yIHdyaXRpbmcgbG9nIG1lc3NhZ2VzIHRvIGZpbGUuIExvZ3MgY2FuIGJlXG4gKiBtYW51YWxseSBmbHVzaGVkIHdpdGggYGZpbGVIYW5kbGVyLmZsdXNoKClgLiBMb2cgbWVzc2FnZXMgd2l0aCBhIGxvZyBsZXZlbFxuICogZ3JlYXRlciB0aGFuIEVSUk9SIGFyZSBpbW1lZGlhdGVseSBmbHVzaGVkLiBMb2dzIGFyZSBhbHNvIGZsdXNoZWQgb24gcHJvY2Vzc1xuICogY29tcGxldGlvbi5cbiAqXG4gKiBBZGRpdGlvbmFsIG5vdGVzIG9uIGBtb2RlYCBhcyBkZXNjcmliZWQgYWJvdmU6XG4gKlxuICogLSBgJ2EnYCBEZWZhdWx0IG1vZGUuIEFzIGFib3ZlLCB0aGlzIHdpbGwgcGljayB1cCB3aGVyZSB0aGUgbG9ncyBsZWZ0IG9mZiBpblxuICogICByb3RhdGlvbiwgb3IgY3JlYXRlIGEgbmV3IGxvZyBmaWxlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gKiAtIGAndydgIGluIGFkZGl0aW9uIHRvIHN0YXJ0aW5nIHdpdGggYSBjbGVhbiBgZmlsZW5hbWVgLCB0aGlzIG1vZGUgd2lsbCBhbHNvXG4gKiAgIGNhdXNlIGFueSBleGlzdGluZyBiYWNrdXBzICh1cCB0byBgbWF4QmFja3VwQ291bnRgKSB0byBiZSBkZWxldGVkIG9uIHNldHVwXG4gKiAgIGdpdmluZyBhIGZ1bGx5IGNsZWFuIHNsYXRlLlxuICogLSBgJ3gnYCByZXF1aXJlcyB0aGF0IG5laXRoZXIgYGZpbGVuYW1lYCwgbm9yIGFueSBiYWNrdXBzICh1cCB0b1xuICogICBgbWF4QmFja3VwQ291bnRgKSwgZXhpc3QgYmVmb3JlIHNldHVwLlxuICpcbiAqIFRoaXMgaGFuZGxlciByZXF1aXJlcyBib3RoIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy13cml0ZWAgcGVybWlzc2lvbnMgb25cbiAqIHRoZSBsb2cgZmlsZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3RhdGluZ0ZpbGVIYW5kbGVyIGV4dGVuZHMgRmlsZUhhbmRsZXIge1xuICAjbWF4Qnl0ZXM6IG51bWJlcjtcbiAgI21heEJhY2t1cENvdW50OiBudW1iZXI7XG4gICNjdXJyZW50RmlsZVNpemUgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsTmFtZTogTGV2ZWxOYW1lLCBvcHRpb25zOiBSb3RhdGluZ0ZpbGVIYW5kbGVyT3B0aW9ucykge1xuICAgIHN1cGVyKGxldmVsTmFtZSwgb3B0aW9ucyk7XG4gICAgdGhpcy4jbWF4Qnl0ZXMgPSBvcHRpb25zLm1heEJ5dGVzO1xuICAgIHRoaXMuI21heEJhY2t1cENvdW50ID0gb3B0aW9ucy5tYXhCYWNrdXBDb3VudDtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldHVwKCkge1xuICAgIGlmICh0aGlzLiNtYXhCeXRlcyA8IDEpIHtcbiAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibWF4Qnl0ZXMgY2Fubm90IGJlIGxlc3MgdGhhbiAxXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jbWF4QmFja3VwQ291bnQgPCAxKSB7XG4gICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm1heEJhY2t1cENvdW50IGNhbm5vdCBiZSBsZXNzIHRoYW4gMVwiKTtcbiAgICB9XG4gICAgc3VwZXIuc2V0dXAoKTtcblxuICAgIGlmICh0aGlzLl9tb2RlID09PSBcIndcIikge1xuICAgICAgLy8gUmVtb3ZlIG9sZCBiYWNrdXBzIHRvbyBhcyBpdCBkb2Vzbid0IG1ha2Ugc2Vuc2UgdG8gc3RhcnQgd2l0aCBhIGNsZWFuXG4gICAgICAvLyBsb2cgZmlsZSwgYnV0IG9sZCBiYWNrdXBzXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLiNtYXhCYWNrdXBDb3VudDsgaSsrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgRGVuby5yZW1vdmVTeW5jKHRoaXMuX2ZpbGVuYW1lICsgXCIuXCIgKyBpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSkge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLl9tb2RlID09PSBcInhcIikge1xuICAgICAgLy8gVGhyb3cgaWYgYW55IGJhY2t1cHMgYWxzbyBleGlzdFxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy4jbWF4QmFja3VwQ291bnQ7IGkrKykge1xuICAgICAgICBpZiAoZXhpc3RzU3luYyh0aGlzLl9maWxlbmFtZSArIFwiLlwiICsgaSkpIHtcbiAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuQWxyZWFkeUV4aXN0cyhcbiAgICAgICAgICAgIFwiQmFja3VwIGxvZyBmaWxlIFwiICsgdGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIGkgKyBcIiBhbHJlYWR5IGV4aXN0c1wiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jY3VycmVudEZpbGVTaXplID0gKERlbm8uc3RhdFN5bmModGhpcy5fZmlsZW5hbWUpKS5zaXplO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGxvZyhtc2c6IHN0cmluZykge1xuICAgIGNvbnN0IG1zZ0J5dGVMZW5ndGggPSB0aGlzLl9lbmNvZGVyLmVuY29kZShtc2cpLmJ5dGVMZW5ndGggKyAxO1xuXG4gICAgaWYgKHRoaXMuI2N1cnJlbnRGaWxlU2l6ZSArIG1zZ0J5dGVMZW5ndGggPiB0aGlzLiNtYXhCeXRlcykge1xuICAgICAgdGhpcy5yb3RhdGVMb2dGaWxlcygpO1xuICAgICAgdGhpcy4jY3VycmVudEZpbGVTaXplID0gMDtcbiAgICB9XG5cbiAgICBzdXBlci5sb2cobXNnKTtcblxuICAgIHRoaXMuI2N1cnJlbnRGaWxlU2l6ZSArPSBtc2dCeXRlTGVuZ3RoO1xuICB9XG5cbiAgcm90YXRlTG9nRmlsZXMoKSB7XG4gICAgdGhpcy5fYnVmLmZsdXNoKCk7XG4gICAgdGhpcy5fZmlsZSEuY2xvc2UoKTtcblxuICAgIGZvciAobGV0IGkgPSB0aGlzLiNtYXhCYWNrdXBDb3VudCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLl9maWxlbmFtZSArIChpID09PSAwID8gXCJcIiA6IFwiLlwiICsgaSk7XG4gICAgICBjb25zdCBkZXN0ID0gdGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIChpICsgMSk7XG5cbiAgICAgIGlmIChleGlzdHNTeW5jKHNvdXJjZSkpIHtcbiAgICAgICAgRGVuby5yZW5hbWVTeW5jKHNvdXJjZSwgZGVzdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZmlsZSA9IERlbm8ub3BlblN5bmModGhpcy5fZmlsZW5hbWUsIHRoaXMuX29wZW5PcHRpb25zKTtcbiAgICB0aGlzLl93cml0ZXIgPSB0aGlzLl9maWxlO1xuICAgIHRoaXMuX2J1ZiA9IG5ldyBCdWZXcml0ZXJTeW5jKHRoaXMuX2ZpbGUpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQVMsY0FBYyxFQUFhLFNBQVMsUUFBUSxjQUFjO0FBRW5FLFNBQVMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxRQUFRLG1CQUFtQjtBQUMzRCxTQUFTLFVBQVUsUUFBUSxrQkFBa0I7QUFDN0MsU0FBUyxhQUFhLFFBQVEsc0JBQXNCO0FBR3BELE1BQU0sb0JBQW9CO0FBUTFCLE9BQU8sTUFBTTtFQUNYLE1BQWM7RUFDZCxVQUFxQjtFQUNyQixVQUFzQztFQUV0QyxZQUFZLFNBQW9CLEVBQUUsVUFBMEIsQ0FBQyxDQUFDLENBQUU7SUFDOUQsSUFBSSxDQUFDLEtBQUssR0FBRyxlQUFlO0lBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUc7SUFFakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLFNBQVMsSUFBSTtFQUN4QztFQUVBLE9BQU8sU0FBb0IsRUFBRTtJQUMzQixJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsVUFBVSxLQUFLLEVBQUU7SUFFbEMsTUFBTSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDeEIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO0VBQ2xCO0VBRUEsT0FBTyxTQUFvQixFQUFVO0lBQ25DLElBQUksSUFBSSxDQUFDLFNBQVMsWUFBWSxVQUFVO01BQ3RDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QjtJQUVBLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTztNQUNwRCxNQUFNLFFBQVEsU0FBUyxDQUFDLEdBQXNCO01BRTlDLG9DQUFvQztNQUNwQyxJQUFJLFVBQVUsV0FBVztRQUN2QixPQUFPO01BQ1Q7TUFFQSxPQUFPLE9BQU87SUFDaEI7RUFDRjtFQUVBLElBQUksSUFBWSxFQUFFLENBQUM7RUFDbkIsUUFBUSxDQUFDO0VBQ1QsVUFBVSxDQUFDO0FBQ2I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLE1BQU0sdUJBQXVCO0VBQ3pCLE9BQU8sU0FBb0IsRUFBVTtJQUM1QyxJQUFJLE1BQU0sS0FBSyxDQUFDLE9BQU87SUFFdkIsT0FBUSxVQUFVLEtBQUs7TUFDckIsS0FBSyxVQUFVLElBQUk7UUFDakIsTUFBTSxLQUFLO1FBQ1g7TUFDRixLQUFLLFVBQVUsT0FBTztRQUNwQixNQUFNLE9BQU87UUFDYjtNQUNGLEtBQUssVUFBVSxLQUFLO1FBQ2xCLE1BQU0sSUFBSTtRQUNWO01BQ0YsS0FBSyxVQUFVLFFBQVE7UUFDckIsTUFBTSxLQUFLLElBQUk7UUFDZjtNQUNGO1FBQ0U7SUFDSjtJQUVBLE9BQU87RUFDVDtFQUVTLElBQUksR0FBVyxFQUFFO0lBQ3hCLFFBQVEsR0FBRyxDQUFDO0VBQ2Q7QUFDRjtBQUVBLE9BQU8sTUFBZSxzQkFBc0I7RUFDaEMsUUFBaUI7RUFDM0IsQ0FBQyxPQUFPLEdBQUcsSUFBSSxjQUFjO0FBRy9CO0FBT0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBaUJDLEdBQ0QsT0FBTyxNQUFNLG9CQUFvQjtFQUNyQixNQUErQjtFQUMvQixLQUFxQjtFQUNyQixVQUFrQjtFQUNsQixNQUFlO0VBQ2YsYUFBK0I7RUFDL0IsV0FBVyxJQUFJLGNBQWM7RUFDdkMsQ0FBQyxjQUFjLEdBQUcsQ0FBQztJQUNqQixJQUFJLENBQUMsT0FBTztFQUNkLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFO0VBRWQsWUFBWSxTQUFvQixFQUFFLE9BQTJCLENBQUU7SUFDN0QsS0FBSyxDQUFDLFdBQVc7SUFDakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLFFBQVE7SUFDakMscUNBQXFDO0lBQ3JDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxJQUFJLEdBQUcsUUFBUSxJQUFJLEdBQUc7SUFDM0MsSUFBSSxDQUFDLFlBQVksR0FBRztNQUNsQixXQUFXLElBQUksQ0FBQyxLQUFLLEtBQUs7TUFDMUIsUUFBUSxJQUFJLENBQUMsS0FBSyxLQUFLO01BQ3ZCLFFBQVEsSUFBSSxDQUFDLEtBQUssS0FBSztNQUN2QixVQUFVLElBQUksQ0FBQyxLQUFLLEtBQUs7TUFDekIsT0FBTztJQUNUO0VBQ0Y7RUFFUyxRQUFRO0lBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxZQUFZO0lBQzVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUs7SUFDekIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGNBQWMsSUFBSSxDQUFDLEtBQUs7SUFFeEMsaUJBQWlCLFVBQVUsSUFBSSxDQUFDLENBQUMsY0FBYztFQUNqRDtFQUVTLE9BQU8sU0FBb0IsRUFBRTtJQUNwQyxLQUFLLENBQUMsT0FBTztJQUViLHNEQUFzRDtJQUN0RCxJQUFJLFVBQVUsS0FBSyxHQUFHLFVBQVUsS0FBSyxFQUFFO01BQ3JDLElBQUksQ0FBQyxLQUFLO0lBQ1o7RUFDRjtFQUVBLElBQUksR0FBVyxFQUFFO0lBQ2YsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLFVBQVUsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJO01BQ3BFLElBQUksQ0FBQyxLQUFLO0lBQ1o7SUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNO0VBQ2pEO0VBRUEsUUFBUTtJQUNOLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxhQUFhLEdBQUc7TUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLO0lBQ2pCO0VBQ0Y7RUFFUyxVQUFVO0lBQ2pCLElBQUksQ0FBQyxLQUFLO0lBQ1YsSUFBSSxDQUFDLEtBQUssRUFBRTtJQUNaLElBQUksQ0FBQyxLQUFLLEdBQUc7SUFDYixvQkFBb0IsVUFBVSxJQUFJLENBQUMsQ0FBQyxjQUFjO0VBQ3BEO0FBQ0Y7QUFPQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFDQyxHQUNELE9BQU8sTUFBTSw0QkFBNEI7RUFDdkMsQ0FBQyxRQUFRLENBQVM7RUFDbEIsQ0FBQyxjQUFjLENBQVM7RUFDeEIsQ0FBQyxlQUFlLEdBQUcsRUFBRTtFQUVyQixZQUFZLFNBQW9CLEVBQUUsT0FBbUMsQ0FBRTtJQUNyRSxLQUFLLENBQUMsV0FBVztJQUNqQixJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxRQUFRO0lBQ2pDLElBQUksQ0FBQyxDQUFDLGNBQWMsR0FBRyxRQUFRLGNBQWM7RUFDL0M7RUFFUyxRQUFRO0lBQ2YsSUFBSSxJQUFJLENBQUMsQ0FBQyxRQUFRLEdBQUcsR0FBRztNQUN0QixJQUFJLENBQUMsT0FBTztNQUNaLE1BQU0sSUFBSSxNQUFNO0lBQ2xCO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQyxjQUFjLEdBQUcsR0FBRztNQUM1QixJQUFJLENBQUMsT0FBTztNQUNaLE1BQU0sSUFBSSxNQUFNO0lBQ2xCO0lBQ0EsS0FBSyxDQUFDO0lBRU4sSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUs7TUFDdEIsd0VBQXdFO01BQ3hFLDRCQUE0QjtNQUM1QixJQUFLLElBQUksSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsY0FBYyxFQUFFLElBQUs7UUFDOUMsSUFBSTtVQUNGLEtBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTTtRQUN6QyxFQUFFLE9BQU8sT0FBTztVQUNkLElBQUksQ0FBQyxDQUFDLGlCQUFpQixLQUFLLE1BQU0sQ0FBQyxRQUFRLEdBQUc7WUFDNUMsTUFBTTtVQUNSO1FBQ0Y7TUFDRjtJQUNGLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUs7TUFDN0Isa0NBQWtDO01BQ2xDLElBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUUsSUFBSztRQUM5QyxJQUFJLFdBQVcsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLElBQUk7VUFDeEMsSUFBSSxDQUFDLE9BQU87VUFDWixNQUFNLElBQUksS0FBSyxNQUFNLENBQUMsYUFBYSxDQUNqQyxxQkFBcUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLElBQUk7UUFFcEQ7TUFDRjtJQUNGLE9BQU87TUFDTCxJQUFJLENBQUMsQ0FBQyxlQUFlLEdBQUcsQUFBQyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFHLElBQUk7SUFDOUQ7RUFDRjtFQUVTLElBQUksR0FBVyxFQUFFO0lBQ3hCLE1BQU0sZ0JBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxHQUFHO0lBRTdELElBQUksSUFBSSxDQUFDLENBQUMsZUFBZSxHQUFHLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUU7TUFDMUQsSUFBSSxDQUFDLGNBQWM7TUFDbkIsSUFBSSxDQUFDLENBQUMsZUFBZSxHQUFHO0lBQzFCO0lBRUEsS0FBSyxDQUFDLElBQUk7SUFFVixJQUFJLENBQUMsQ0FBQyxlQUFlLElBQUk7RUFDM0I7RUFFQSxpQkFBaUI7SUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUs7SUFDZixJQUFJLENBQUMsS0FBSyxDQUFFLEtBQUs7SUFFakIsSUFBSyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsY0FBYyxHQUFHLEdBQUcsS0FBSyxHQUFHLElBQUs7TUFDbEQsTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxNQUFNLElBQUksS0FBSyxNQUFNLENBQUM7TUFDdkQsTUFBTSxPQUFPLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztNQUUxQyxJQUFJLFdBQVcsU0FBUztRQUN0QixLQUFLLFVBQVUsQ0FBQyxRQUFRO01BQzFCO0lBQ0Y7SUFFQSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVk7SUFDNUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSztJQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksY0FBYyxJQUFJLENBQUMsS0FBSztFQUMxQztBQUNGIn0=