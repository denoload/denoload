// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
/**
 * Utilities for working with OS-specific file paths.
 *
 * Codes in the examples uses POSIX path but it automatically use Windows path
 * on Windows. Use methods under `posix` or `win32` object instead to handle non
 * platform specific path like:
 * ```ts
 * import { posix, win32 } from "https://deno.land/std@$STD_VERSION/path/mod.ts";
 * const p1 = posix.fromFileUrl("file:///home/foo");
 * const p2 = win32.fromFileUrl("file:///home/foo");
 * console.log(p1); // "/home/foo"
 * console.log(p2); // "\\home\\foo"
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */ import { isWindows } from "./_os.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
export const win32 = _win32;
export const posix = _posix;
export const delimiter = isWindows ? win32.delimiter : posix.delimiter;
export * from "./basename.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./format.ts";
export * from "./from_file_url.ts";
export * from "./is_absolute.ts";
export * from "./join.ts";
export * from "./normalize.ts";
export * from "./parse.ts";
export * from "./relative.ts";
export * from "./resolve.ts";
export * from "./to_file_url.ts";
export * from "./to_namespaced_path.ts";
export * from "./common.ts";
export * from "./separator.ts";
export * from "./_interface.ts";
export * from "./glob.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgbW9zdGx5IGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIE9TLXNwZWNpZmljIGZpbGUgcGF0aHMuXG4gKlxuICogQ29kZXMgaW4gdGhlIGV4YW1wbGVzIHVzZXMgUE9TSVggcGF0aCBidXQgaXQgYXV0b21hdGljYWxseSB1c2UgV2luZG93cyBwYXRoXG4gKiBvbiBXaW5kb3dzLiBVc2UgbWV0aG9kcyB1bmRlciBgcG9zaXhgIG9yIGB3aW4zMmAgb2JqZWN0IGluc3RlYWQgdG8gaGFuZGxlIG5vblxuICogcGxhdGZvcm0gc3BlY2lmaWMgcGF0aCBsaWtlOlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHBvc2l4LCB3aW4zMiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3BhdGgvbW9kLnRzXCI7XG4gKiBjb25zdCBwMSA9IHBvc2l4LmZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTtcbiAqIGNvbnN0IHAyID0gd2luMzIuZnJvbUZpbGVVcmwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpO1xuICogY29uc29sZS5sb2cocDEpOyAvLyBcIi9ob21lL2Zvb1wiXG4gKiBjb25zb2xlLmxvZyhwMik7IC8vIFwiXFxcXGhvbWVcXFxcZm9vXCJcbiAqIGBgYFxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgKiBhcyBfd2luMzIgZnJvbSBcIi4vd2luMzIudHNcIjtcbmltcG9ydCAqIGFzIF9wb3NpeCBmcm9tIFwiLi9wb3NpeC50c1wiO1xuXG5leHBvcnQgY29uc3Qgd2luMzIgPSBfd2luMzI7XG5leHBvcnQgY29uc3QgcG9zaXggPSBfcG9zaXg7XG5leHBvcnQgY29uc3QgZGVsaW1pdGVyID0gaXNXaW5kb3dzID8gd2luMzIuZGVsaW1pdGVyIDogcG9zaXguZGVsaW1pdGVyO1xuXG5leHBvcnQgKiBmcm9tIFwiLi9iYXNlbmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZGlybmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZXh0bmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZm9ybWF0LnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9mcm9tX2ZpbGVfdXJsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9pc19hYnNvbHV0ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vam9pbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbm9ybWFsaXplLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9wYXJzZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVsYXRpdmUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3Jlc29sdmUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX2ZpbGVfdXJsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi90b19uYW1lc3BhY2VkX3BhdGgudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2NvbW1vbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vc2VwYXJhdG9yLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9nbG9iLnRzXCI7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLGlEQUFpRDtBQUNqRCxvRUFBb0U7QUFDcEUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUVELFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsWUFBWSxZQUFZLGFBQWE7QUFDckMsWUFBWSxZQUFZLGFBQWE7QUFFckMsT0FBTyxNQUFNLFFBQVEsT0FBTztBQUM1QixPQUFPLE1BQU0sUUFBUSxPQUFPO0FBQzVCLE9BQU8sTUFBTSxZQUFZLFlBQVksTUFBTSxTQUFTLEdBQUcsTUFBTSxTQUFTLENBQUM7QUFFdkUsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxlQUFlO0FBQzdCLGNBQWMsZUFBZTtBQUM3QixjQUFjLGNBQWM7QUFDNUIsY0FBYyxxQkFBcUI7QUFDbkMsY0FBYyxtQkFBbUI7QUFDakMsY0FBYyxZQUFZO0FBQzFCLGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsYUFBYTtBQUMzQixjQUFjLGdCQUFnQjtBQUM5QixjQUFjLGVBQWU7QUFDN0IsY0FBYyxtQkFBbUI7QUFDakMsY0FBYywwQkFBMEI7QUFDeEMsY0FBYyxjQUFjO0FBQzVCLGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsa0JBQWtCO0FBQ2hDLGNBQWMsWUFBWSJ9