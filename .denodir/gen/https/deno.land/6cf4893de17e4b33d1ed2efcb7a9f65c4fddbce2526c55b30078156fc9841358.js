// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Test whether or not the given path exists by checking with the file system. Please consider to check if the path is readable and either a file or a directory by providing additional `options`:
 *
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 * const isReadableDir = await exists("./foo", {
 *   isReadable: true,
 *   isDirectory: true
 * });
 * const isReadableFile = await exists("./bar", {
 *   isReadable: true,
 *   isFile: true
 * });
 * ```
 *
 * Note: Do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (await exists("./foo")) {
 *   await Deno.remove("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of exists
 * try {
 *   await Deno.remove("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */ export async function exists(path, options) {
  try {
    const stat = await Deno.stat(path);
    if (options && (options.isReadable || options.isDirectory || options.isFile)) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
      }
      if (options.isDirectory && !stat.isDirectory || options.isFile && !stat.isFile) {
        return false;
      }
      if (options.isReadable) {
        if (stat.mode === null) {
          return true; // Exclusive on Non-POSIX systems
        }
        if (Deno.uid() === stat.uid) {
          return (stat.mode & 0o400) === 0o400; // User is owner and can read?
        } else if (Deno.gid() === stat.gid) {
          return (stat.mode & 0o040) === 0o040; // User group is owner and can read?
        }
        return (stat.mode & 0o004) === 0o004; // Others can read?
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      if ((await Deno.permissions.query({
        name: "read",
        path
      })).state === "granted") {
        // --allow-read not missing
        return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
      }
    }
    throw error;
  }
}
/**
 * Test whether or not the given path exists by checking with the file system. Please consider to check if the path is readable and either a file or a directory by providing additional `options`:
 *
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 * const isReadableDir = existsSync("./foo", {
 *   isReadable: true,
 *   isDirectory: true
 * });
 * const isReadableFile = existsSync("./bar", {
 *   isReadable: true,
 *   isFile: true
 * });
 * ```
 *
 * Note: do not use this function if performing a check before another operation on that file. Doing so creates a race condition. Instead, perform the actual file operation directly.
 *
 * Bad:
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
 *
 * if (existsSync("./foo")) {
 *   Deno.removeSync("./foo");
 * }
 * ```
 *
 * Good:
 * ```ts
 * // Notice no use of existsSync
 * try {
 *   Deno.removeSync("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 */ export function existsSync(path, options) {
  try {
    const stat = Deno.statSync(path);
    if (options && (options.isReadable || options.isDirectory || options.isFile)) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
      }
      if (options.isDirectory && !stat.isDirectory || options.isFile && !stat.isFile) {
        return false;
      }
      if (options.isReadable) {
        if (stat.mode === null) {
          return true; // Exclusive on Non-POSIX systems
        }
        if (Deno.uid() === stat.uid) {
          return (stat.mode & 0o400) === 0o400; // User is owner and can read?
        } else if (Deno.gid() === stat.gid) {
          return (stat.mode & 0o040) === 0o040; // User group is owner and can read?
        }
        return (stat.mode & 0o004) === 0o004; // Others can read?
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      if (Deno.permissions.querySync({
        name: "read",
        path
      }).state === "granted") {
        // --allow-read not missing
        return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
      }
    }
    throw error;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2ZzL2V4aXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5leHBvcnQgaW50ZXJmYWNlIEV4aXN0c09wdGlvbnMge1xuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAsIHdpbGwgY2hlY2sgaWYgdGhlIHBhdGggaXMgcmVhZGFibGUgYnkgdGhlIHVzZXIgYXMgd2VsbC5cbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgaXNSZWFkYWJsZT86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCwgd2lsbCBjaGVjayBpZiB0aGUgcGF0aCBpcyBhIGRpcmVjdG9yeSBhcyB3ZWxsLlxuICAgKiBEaXJlY3Rvcnkgc3ltbGlua3MgYXJlIGluY2x1ZGVkLlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBpc0RpcmVjdG9yeT86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBXaGVuIGB0cnVlYCwgd2lsbCBjaGVjayBpZiB0aGUgcGF0aCBpcyBhIGZpbGUgYXMgd2VsbC5cbiAgICogRmlsZSBzeW1saW5rcyBhcmUgaW5jbHVkZWQuXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIGlzRmlsZT86IGJvb2xlYW47XG59XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gcGF0aCBleGlzdHMgYnkgY2hlY2tpbmcgd2l0aCB0aGUgZmlsZSBzeXN0ZW0uIFBsZWFzZSBjb25zaWRlciB0byBjaGVjayBpZiB0aGUgcGF0aCBpcyByZWFkYWJsZSBhbmQgZWl0aGVyIGEgZmlsZSBvciBhIGRpcmVjdG9yeSBieSBwcm92aWRpbmcgYWRkaXRpb25hbCBgb3B0aW9uc2A6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4aXN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL21vZC50c1wiO1xuICogY29uc3QgaXNSZWFkYWJsZURpciA9IGF3YWl0IGV4aXN0cyhcIi4vZm9vXCIsIHtcbiAqICAgaXNSZWFkYWJsZTogdHJ1ZSxcbiAqICAgaXNEaXJlY3Rvcnk6IHRydWVcbiAqIH0pO1xuICogY29uc3QgaXNSZWFkYWJsZUZpbGUgPSBhd2FpdCBleGlzdHMoXCIuL2JhclwiLCB7XG4gKiAgIGlzUmVhZGFibGU6IHRydWUsXG4gKiAgIGlzRmlsZTogdHJ1ZVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBOb3RlOiBEbyBub3QgdXNlIHRoaXMgZnVuY3Rpb24gaWYgcGVyZm9ybWluZyBhIGNoZWNrIGJlZm9yZSBhbm90aGVyIG9wZXJhdGlvbiBvbiB0aGF0IGZpbGUuIERvaW5nIHNvIGNyZWF0ZXMgYSByYWNlIGNvbmRpdGlvbi4gSW5zdGVhZCwgcGVyZm9ybSB0aGUgYWN0dWFsIGZpbGUgb3BlcmF0aW9uIGRpcmVjdGx5LlxuICpcbiAqIEJhZDpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleGlzdHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9tb2QudHNcIjtcbiAqXG4gKiBpZiAoYXdhaXQgZXhpc3RzKFwiLi9mb29cIikpIHtcbiAqICAgYXdhaXQgRGVuby5yZW1vdmUoXCIuL2Zvb1wiKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEdvb2Q6XG4gKiBgYGB0c1xuICogLy8gTm90aWNlIG5vIHVzZSBvZiBleGlzdHNcbiAqIHRyeSB7XG4gKiAgIGF3YWl0IERlbm8ucmVtb3ZlKFwiLi9mb29cIiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gKiB9IGNhdGNoIChlcnJvcikge1xuICogICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSkge1xuICogICAgIHRocm93IGVycm9yO1xuICogICB9XG4gKiAgIC8vIERvIG5vdGhpbmcuLi5cbiAqIH1cbiAqIGBgYFxuICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9UaW1lLW9mLWNoZWNrX3RvX3RpbWUtb2YtdXNlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGlzdHMoXG4gIHBhdGg6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9ucz86IEV4aXN0c09wdGlvbnMsXG4pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0ID0gYXdhaXQgRGVuby5zdGF0KHBhdGgpO1xuICAgIGlmIChcbiAgICAgIG9wdGlvbnMgJiZcbiAgICAgIChvcHRpb25zLmlzUmVhZGFibGUgfHwgb3B0aW9ucy5pc0RpcmVjdG9yeSB8fCBvcHRpb25zLmlzRmlsZSlcbiAgICApIHtcbiAgICAgIGlmIChvcHRpb25zLmlzRGlyZWN0b3J5ICYmIG9wdGlvbnMuaXNGaWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgXCJFeGlzdHNPcHRpb25zLm9wdGlvbnMuaXNEaXJlY3RvcnkgYW5kIEV4aXN0c09wdGlvbnMub3B0aW9ucy5pc0ZpbGUgbXVzdCBub3QgYmUgdHJ1ZSB0b2dldGhlci5cIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgKG9wdGlvbnMuaXNEaXJlY3RvcnkgJiYgIXN0YXQuaXNEaXJlY3RvcnkpIHx8XG4gICAgICAgIChvcHRpb25zLmlzRmlsZSAmJiAhc3RhdC5pc0ZpbGUpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuaXNSZWFkYWJsZSkge1xuICAgICAgICBpZiAoc3RhdC5tb2RlID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEV4Y2x1c2l2ZSBvbiBOb24tUE9TSVggc3lzdGVtc1xuICAgICAgICB9XG4gICAgICAgIGlmIChEZW5vLnVpZCgpID09PSBzdGF0LnVpZCkge1xuICAgICAgICAgIHJldHVybiAoc3RhdC5tb2RlICYgMG80MDApID09PSAwbzQwMDsgLy8gVXNlciBpcyBvd25lciBhbmQgY2FuIHJlYWQ/XG4gICAgICAgIH0gZWxzZSBpZiAoRGVuby5naWQoKSA9PT0gc3RhdC5naWQpIHtcbiAgICAgICAgICByZXR1cm4gKHN0YXQubW9kZSAmIDBvMDQwKSA9PT0gMG8wNDA7IC8vIFVzZXIgZ3JvdXAgaXMgb3duZXIgYW5kIGNhbiByZWFkP1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoc3RhdC5tb2RlICYgMG8wMDQpID09PSAwbzAwNDsgLy8gT3RoZXJzIGNhbiByZWFkP1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5QZXJtaXNzaW9uRGVuaWVkKSB7XG4gICAgICBpZiAoXG4gICAgICAgIChhd2FpdCBEZW5vLnBlcm1pc3Npb25zLnF1ZXJ5KHsgbmFtZTogXCJyZWFkXCIsIHBhdGggfSkpLnN0YXRlID09PVxuICAgICAgICAgIFwiZ3JhbnRlZFwiXG4gICAgICApIHtcbiAgICAgICAgLy8gLS1hbGxvdy1yZWFkIG5vdCBtaXNzaW5nXG4gICAgICAgIHJldHVybiAhb3B0aW9ucz8uaXNSZWFkYWJsZTsgLy8gUGVybWlzc2lvbkRlbmllZCB3YXMgcmFpc2VkIGJ5IGZpbGUgc3lzdGVtLCBzbyB0aGUgaXRlbSBleGlzdHMsIGJ1dCBjYW4ndCBiZSByZWFkXG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gcGF0aCBleGlzdHMgYnkgY2hlY2tpbmcgd2l0aCB0aGUgZmlsZSBzeXN0ZW0uIFBsZWFzZSBjb25zaWRlciB0byBjaGVjayBpZiB0aGUgcGF0aCBpcyByZWFkYWJsZSBhbmQgZWl0aGVyIGEgZmlsZSBvciBhIGRpcmVjdG9yeSBieSBwcm92aWRpbmcgYWRkaXRpb25hbCBgb3B0aW9uc2A6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9tb2QudHNcIjtcbiAqIGNvbnN0IGlzUmVhZGFibGVEaXIgPSBleGlzdHNTeW5jKFwiLi9mb29cIiwge1xuICogICBpc1JlYWRhYmxlOiB0cnVlLFxuICogICBpc0RpcmVjdG9yeTogdHJ1ZVxuICogfSk7XG4gKiBjb25zdCBpc1JlYWRhYmxlRmlsZSA9IGV4aXN0c1N5bmMoXCIuL2JhclwiLCB7XG4gKiAgIGlzUmVhZGFibGU6IHRydWUsXG4gKiAgIGlzRmlsZTogdHJ1ZVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBOb3RlOiBkbyBub3QgdXNlIHRoaXMgZnVuY3Rpb24gaWYgcGVyZm9ybWluZyBhIGNoZWNrIGJlZm9yZSBhbm90aGVyIG9wZXJhdGlvbiBvbiB0aGF0IGZpbGUuIERvaW5nIHNvIGNyZWF0ZXMgYSByYWNlIGNvbmRpdGlvbi4gSW5zdGVhZCwgcGVyZm9ybSB0aGUgYWN0dWFsIGZpbGUgb3BlcmF0aW9uIGRpcmVjdGx5LlxuICpcbiAqIEJhZDpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZnMvbW9kLnRzXCI7XG4gKlxuICogaWYgKGV4aXN0c1N5bmMoXCIuL2Zvb1wiKSkge1xuICogICBEZW5vLnJlbW92ZVN5bmMoXCIuL2Zvb1wiKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEdvb2Q6XG4gKiBgYGB0c1xuICogLy8gTm90aWNlIG5vIHVzZSBvZiBleGlzdHNTeW5jXG4gKiB0cnkge1xuICogICBEZW5vLnJlbW92ZVN5bmMoXCIuL2Zvb1wiLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAqIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgIGlmICghKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpKSB7XG4gKiAgICAgdGhyb3cgZXJyb3I7XG4gKiAgIH1cbiAqICAgLy8gRG8gbm90aGluZy4uLlxuICogfVxuICogYGBgXG4gKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RpbWUtb2YtY2hlY2tfdG9fdGltZS1vZi11c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4aXN0c1N5bmMoXG4gIHBhdGg6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9ucz86IEV4aXN0c09wdGlvbnMsXG4pOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0ID0gRGVuby5zdGF0U3luYyhwYXRoKTtcbiAgICBpZiAoXG4gICAgICBvcHRpb25zICYmXG4gICAgICAob3B0aW9ucy5pc1JlYWRhYmxlIHx8IG9wdGlvbnMuaXNEaXJlY3RvcnkgfHwgb3B0aW9ucy5pc0ZpbGUpXG4gICAgKSB7XG4gICAgICBpZiAob3B0aW9ucy5pc0RpcmVjdG9yeSAmJiBvcHRpb25zLmlzRmlsZSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIFwiRXhpc3RzT3B0aW9ucy5vcHRpb25zLmlzRGlyZWN0b3J5IGFuZCBFeGlzdHNPcHRpb25zLm9wdGlvbnMuaXNGaWxlIG11c3Qgbm90IGJlIHRydWUgdG9nZXRoZXIuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIChvcHRpb25zLmlzRGlyZWN0b3J5ICYmICFzdGF0LmlzRGlyZWN0b3J5KSB8fFxuICAgICAgICAob3B0aW9ucy5pc0ZpbGUgJiYgIXN0YXQuaXNGaWxlKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLmlzUmVhZGFibGUpIHtcbiAgICAgICAgaWYgKHN0YXQubW9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBFeGNsdXNpdmUgb24gTm9uLVBPU0lYIHN5c3RlbXNcbiAgICAgICAgfVxuICAgICAgICBpZiAoRGVuby51aWQoKSA9PT0gc3RhdC51aWQpIHtcbiAgICAgICAgICByZXR1cm4gKHN0YXQubW9kZSAmIDBvNDAwKSA9PT0gMG80MDA7IC8vIFVzZXIgaXMgb3duZXIgYW5kIGNhbiByZWFkP1xuICAgICAgICB9IGVsc2UgaWYgKERlbm8uZ2lkKCkgPT09IHN0YXQuZ2lkKSB7XG4gICAgICAgICAgcmV0dXJuIChzdGF0Lm1vZGUgJiAwbzA0MCkgPT09IDBvMDQwOyAvLyBVc2VyIGdyb3VwIGlzIG93bmVyIGFuZCBjYW4gcmVhZD9cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHN0YXQubW9kZSAmIDBvMDA0KSA9PT0gMG8wMDQ7IC8vIE90aGVycyBjYW4gcmVhZD9cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuUGVybWlzc2lvbkRlbmllZCkge1xuICAgICAgaWYgKFxuICAgICAgICBEZW5vLnBlcm1pc3Npb25zLnF1ZXJ5U3luYyh7IG5hbWU6IFwicmVhZFwiLCBwYXRoIH0pLnN0YXRlID09PSBcImdyYW50ZWRcIlxuICAgICAgKSB7XG4gICAgICAgIC8vIC0tYWxsb3ctcmVhZCBub3QgbWlzc2luZ1xuICAgICAgICByZXR1cm4gIW9wdGlvbnM/LmlzUmVhZGFibGU7IC8vIFBlcm1pc3Npb25EZW5pZWQgd2FzIHJhaXNlZCBieSBmaWxlIHN5c3RlbSwgc28gdGhlIGl0ZW0gZXhpc3RzLCBidXQgY2FuJ3QgYmUgcmVhZFxuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBlcnJv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