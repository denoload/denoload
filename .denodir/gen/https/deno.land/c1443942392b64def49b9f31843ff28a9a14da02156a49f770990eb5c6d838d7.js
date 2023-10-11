// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { CHAR_COLON } from "./_constants.ts";
import { assertPath, isPathSeparator, isPosixPathSeparator, isWindowsDeviceRoot, normalizeString } from "./_util.ts";
/**
 * Resolves path segments into a `path`
 * @param pathSegments to process to path
 */ export function posixResolve(...pathSegments) {
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
    let path;
    if (i >= 0) path = pathSegments[i];
    else {
      // deno-lint-ignore no-explicit-any
      const { Deno } = globalThis;
      if (typeof Deno?.cwd !== "function") {
        throw new TypeError("Resolved a relative path without a CWD.");
      }
      path = Deno.cwd();
    }
    assertPath(path);
    // Skip empty entries
    if (path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  }
  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when Deno.cwd() fails)
  // Normalize the path
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
  if (resolvedAbsolute) {
    if (resolvedPath.length > 0) return `/${resolvedPath}`;
    else return "/";
  } else if (resolvedPath.length > 0) return resolvedPath;
  else return ".";
}
/**
 * Resolves path segments into a `path`
 * @param pathSegments to process to path
 */ export function windowsResolve(...pathSegments) {
  let resolvedDevice = "";
  let resolvedTail = "";
  let resolvedAbsolute = false;
  for(let i = pathSegments.length - 1; i >= -1; i--){
    let path;
    // deno-lint-ignore no-explicit-any
    const { Deno } = globalThis;
    if (i >= 0) {
      path = pathSegments[i];
    } else if (!resolvedDevice) {
      if (typeof Deno?.cwd !== "function") {
        throw new TypeError("Resolved a drive-letter-less path without a CWD.");
      }
      path = Deno.cwd();
    } else {
      if (typeof Deno?.env?.get !== "function" || typeof Deno?.cwd !== "function") {
        throw new TypeError("Resolved a relative path without a CWD.");
      }
      path = Deno.cwd();
      // Verify that a cwd was found and that it actually points
      // to our drive. If not, default to the drive's root.
      if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
        path = `${resolvedDevice}\\`;
      }
    }
    assertPath(path);
    const len = path.length;
    // Skip empty entries
    if (len === 0) continue;
    let rootEnd = 0;
    let device = "";
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    // Try to match a root
    if (len > 1) {
      if (isPathSeparator(code)) {
        // Possible UNC root
        // If we started with a separator, we know we at least have an
        // absolute path of some kind (UNC or otherwise)
        isAbsolute = true;
        if (isPathSeparator(path.charCodeAt(1))) {
          // Matched double path separator at beginning
          let j = 2;
          let last = j;
          // Match 1 or more non-path separators
          for(; j < len; ++j){
            if (isPathSeparator(path.charCodeAt(j))) break;
          }
          if (j < len && j !== last) {
            const firstPart = path.slice(last, j);
            // Matched!
            last = j;
            // Match 1 or more path separators
            for(; j < len; ++j){
              if (!isPathSeparator(path.charCodeAt(j))) break;
            }
            if (j < len && j !== last) {
              // Matched!
              last = j;
              // Match 1 or more non-path separators
              for(; j < len; ++j){
                if (isPathSeparator(path.charCodeAt(j))) break;
              }
              if (j === len) {
                // We matched a UNC root only
                device = `\\\\${firstPart}\\${path.slice(last)}`;
                rootEnd = j;
              } else if (j !== last) {
                // We matched a UNC root with leftovers
                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                rootEnd = j;
              }
            }
          }
        } else {
          rootEnd = 1;
        }
      } else if (isWindowsDeviceRoot(code)) {
        // Possible device root
        if (path.charCodeAt(1) === CHAR_COLON) {
          device = path.slice(0, 2);
          rootEnd = 2;
          if (len > 2) {
            if (isPathSeparator(path.charCodeAt(2))) {
              // Treat separator following drive name as an absolute path
              // indicator
              isAbsolute = true;
              rootEnd = 3;
            }
          }
        }
      }
    } else if (isPathSeparator(code)) {
      // `path` contains just a path separator
      rootEnd = 1;
      isAbsolute = true;
    }
    if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
      continue;
    }
    if (resolvedDevice.length === 0 && device.length > 0) {
      resolvedDevice = device;
    }
    if (!resolvedAbsolute) {
      resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
      resolvedAbsolute = isAbsolute;
    }
    if (resolvedAbsolute && resolvedDevice.length > 0) break;
  }
  // At this point the path should be resolved to a full absolute path,
  // but handle relative paths to be safe (might happen when Deno.cwd()
  // fails)
  // Normalize the tail path
  resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
  return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvX3Jlc29sdmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgQ0hBUl9DT0xPTiB9IGZyb20gXCIuL19jb25zdGFudHMudHNcIjtcbmltcG9ydCB7XG4gIGFzc2VydFBhdGgsXG4gIGlzUGF0aFNlcGFyYXRvcixcbiAgaXNQb3NpeFBhdGhTZXBhcmF0b3IsXG4gIGlzV2luZG93c0RldmljZVJvb3QsXG4gIG5vcm1hbGl6ZVN0cmluZyxcbn0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuLyoqXG4gKiBSZXNvbHZlcyBwYXRoIHNlZ21lbnRzIGludG8gYSBgcGF0aGBcbiAqIEBwYXJhbSBwYXRoU2VnbWVudHMgdG8gcHJvY2VzcyB0byBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwb3NpeFJlc29sdmUoLi4ucGF0aFNlZ21lbnRzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGxldCByZXNvbHZlZFBhdGggPSBcIlwiO1xuICBsZXQgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSBwYXRoU2VnbWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgbGV0IHBhdGg6IHN0cmluZztcblxuICAgIGlmIChpID49IDApIHBhdGggPSBwYXRoU2VnbWVudHNbaV07XG4gICAgZWxzZSB7XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbiAgICAgIGlmICh0eXBlb2YgRGVubz8uY3dkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlJlc29sdmVkIGEgcmVsYXRpdmUgcGF0aCB3aXRob3V0IGEgQ1dELlwiKTtcbiAgICAgIH1cbiAgICAgIHBhdGggPSBEZW5vLmN3ZCgpO1xuICAgIH1cblxuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGVudHJpZXNcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IGAke3BhdGh9LyR7cmVzb2x2ZWRQYXRofWA7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGlzUG9zaXhQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgwKSk7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBEZW5vLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVTdHJpbmcoXG4gICAgcmVzb2x2ZWRQYXRoLFxuICAgICFyZXNvbHZlZEFic29sdXRlLFxuICAgIFwiL1wiLFxuICAgIGlzUG9zaXhQYXRoU2VwYXJhdG9yLFxuICApO1xuXG4gIGlmIChyZXNvbHZlZEFic29sdXRlKSB7XG4gICAgaWYgKHJlc29sdmVkUGF0aC5sZW5ndGggPiAwKSByZXR1cm4gYC8ke3Jlc29sdmVkUGF0aH1gO1xuICAgIGVsc2UgcmV0dXJuIFwiL1wiO1xuICB9IGVsc2UgaWYgKHJlc29sdmVkUGF0aC5sZW5ndGggPiAwKSByZXR1cm4gcmVzb2x2ZWRQYXRoO1xuICBlbHNlIHJldHVybiBcIi5cIjtcbn1cblxuLyoqXG4gKiBSZXNvbHZlcyBwYXRoIHNlZ21lbnRzIGludG8gYSBgcGF0aGBcbiAqIEBwYXJhbSBwYXRoU2VnbWVudHMgdG8gcHJvY2VzcyB0byBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aW5kb3dzUmVzb2x2ZSguLi5wYXRoU2VnbWVudHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgbGV0IHJlc29sdmVkRGV2aWNlID0gXCJcIjtcbiAgbGV0IHJlc29sdmVkVGFpbCA9IFwiXCI7XG4gIGxldCByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IHBhdGhTZWdtZW50cy5sZW5ndGggLSAxOyBpID49IC0xOyBpLS0pIHtcbiAgICBsZXQgcGF0aDogc3RyaW5nO1xuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgeyBEZW5vIH0gPSBnbG9iYWxUaGlzIGFzIGFueTtcbiAgICBpZiAoaSA+PSAwKSB7XG4gICAgICBwYXRoID0gcGF0aFNlZ21lbnRzW2ldO1xuICAgIH0gZWxzZSBpZiAoIXJlc29sdmVkRGV2aWNlKSB7XG4gICAgICBpZiAodHlwZW9mIERlbm8/LmN3ZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJSZXNvbHZlZCBhIGRyaXZlLWxldHRlci1sZXNzIHBhdGggd2l0aG91dCBhIENXRC5cIik7XG4gICAgICB9XG4gICAgICBwYXRoID0gRGVuby5jd2QoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgRGVubz8uZW52Py5nZXQgIT09IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgRGVubz8uY3dkICE9PSBcImZ1bmN0aW9uXCJcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUmVzb2x2ZWQgYSByZWxhdGl2ZSBwYXRoIHdpdGhvdXQgYSBDV0QuXCIpO1xuICAgICAgfVxuICAgICAgcGF0aCA9IERlbm8uY3dkKCk7XG5cbiAgICAgIC8vIFZlcmlmeSB0aGF0IGEgY3dkIHdhcyBmb3VuZCBhbmQgdGhhdCBpdCBhY3R1YWxseSBwb2ludHNcbiAgICAgIC8vIHRvIG91ciBkcml2ZS4gSWYgbm90LCBkZWZhdWx0IHRvIHRoZSBkcml2ZSdzIHJvb3QuXG4gICAgICBpZiAoXG4gICAgICAgIHBhdGggPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICBwYXRoLnNsaWNlKDAsIDMpLnRvTG93ZXJDYXNlKCkgIT09IGAke3Jlc29sdmVkRGV2aWNlLnRvTG93ZXJDYXNlKCl9XFxcXGBcbiAgICAgICkge1xuICAgICAgICBwYXRoID0gYCR7cmVzb2x2ZWREZXZpY2V9XFxcXGA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgIGNvbnN0IGxlbiA9IHBhdGgubGVuZ3RoO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBlbnRyaWVzXG4gICAgaWYgKGxlbiA9PT0gMCkgY29udGludWU7XG5cbiAgICBsZXQgcm9vdEVuZCA9IDA7XG4gICAgbGV0IGRldmljZSA9IFwiXCI7XG4gICAgbGV0IGlzQWJzb2x1dGUgPSBmYWxzZTtcbiAgICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuXG4gICAgLy8gVHJ5IHRvIG1hdGNoIGEgcm9vdFxuICAgIGlmIChsZW4gPiAxKSB7XG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgICAgIC8vIFBvc3NpYmxlIFVOQyByb290XG5cbiAgICAgICAgLy8gSWYgd2Ugc3RhcnRlZCB3aXRoIGEgc2VwYXJhdG9yLCB3ZSBrbm93IHdlIGF0IGxlYXN0IGhhdmUgYW5cbiAgICAgICAgLy8gYWJzb2x1dGUgcGF0aCBvZiBzb21lIGtpbmQgKFVOQyBvciBvdGhlcndpc2UpXG4gICAgICAgIGlzQWJzb2x1dGUgPSB0cnVlO1xuXG4gICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAgIC8vIE1hdGNoZWQgZG91YmxlIHBhdGggc2VwYXJhdG9yIGF0IGJlZ2lubmluZ1xuICAgICAgICAgIGxldCBqID0gMjtcbiAgICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICBjb25zdCBmaXJzdFBhcnQgPSBwYXRoLnNsaWNlKGxhc3QsIGopO1xuICAgICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIHBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgICBpZiAoIWlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChqID09PSBsZW4pIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgb25seVxuICAgICAgICAgICAgICAgIGRldmljZSA9IGBcXFxcXFxcXCR7Zmlyc3RQYXJ0fVxcXFwke3BhdGguc2xpY2UobGFzdCl9YDtcbiAgICAgICAgICAgICAgICByb290RW5kID0gajtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IHdpdGggbGVmdG92ZXJzXG5cbiAgICAgICAgICAgICAgICBkZXZpY2UgPSBgXFxcXFxcXFwke2ZpcnN0UGFydH1cXFxcJHtwYXRoLnNsaWNlKGxhc3QsIGopfWA7XG4gICAgICAgICAgICAgICAgcm9vdEVuZCA9IGo7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcm9vdEVuZCA9IDE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlUm9vdChjb2RlKSkge1xuICAgICAgICAvLyBQb3NzaWJsZSBkZXZpY2Ugcm9vdFxuXG4gICAgICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQ09MT04pIHtcbiAgICAgICAgICBkZXZpY2UgPSBwYXRoLnNsaWNlKDAsIDIpO1xuICAgICAgICAgIHJvb3RFbmQgPSAyO1xuICAgICAgICAgIGlmIChsZW4gPiAyKSB7XG4gICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgyKSkpIHtcbiAgICAgICAgICAgICAgLy8gVHJlYXQgc2VwYXJhdG9yIGZvbGxvd2luZyBkcml2ZSBuYW1lIGFzIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgICAgLy8gaW5kaWNhdG9yXG4gICAgICAgICAgICAgIGlzQWJzb2x1dGUgPSB0cnVlO1xuICAgICAgICAgICAgICByb290RW5kID0gMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBwYXRoIHNlcGFyYXRvclxuICAgICAgcm9vdEVuZCA9IDE7XG4gICAgICBpc0Fic29sdXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBkZXZpY2UubGVuZ3RoID4gMCAmJlxuICAgICAgcmVzb2x2ZWREZXZpY2UubGVuZ3RoID4gMCAmJlxuICAgICAgZGV2aWNlLnRvTG93ZXJDYXNlKCkgIT09IHJlc29sdmVkRGV2aWNlLnRvTG93ZXJDYXNlKClcbiAgICApIHtcbiAgICAgIC8vIFRoaXMgcGF0aCBwb2ludHMgdG8gYW5vdGhlciBkZXZpY2Ugc28gaXQgaXMgbm90IGFwcGxpY2FibGVcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChyZXNvbHZlZERldmljZS5sZW5ndGggPT09IDAgJiYgZGV2aWNlLmxlbmd0aCA+IDApIHtcbiAgICAgIHJlc29sdmVkRGV2aWNlID0gZGV2aWNlO1xuICAgIH1cbiAgICBpZiAoIXJlc29sdmVkQWJzb2x1dGUpIHtcbiAgICAgIHJlc29sdmVkVGFpbCA9IGAke3BhdGguc2xpY2Uocm9vdEVuZCl9XFxcXCR7cmVzb2x2ZWRUYWlsfWA7XG4gICAgICByZXNvbHZlZEFic29sdXRlID0gaXNBYnNvbHV0ZTtcbiAgICB9XG5cbiAgICBpZiAocmVzb2x2ZWRBYnNvbHV0ZSAmJiByZXNvbHZlZERldmljZS5sZW5ndGggPiAwKSBicmVhaztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLFxuICAvLyBidXQgaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIERlbm8uY3dkKClcbiAgLy8gZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSB0YWlsIHBhdGhcbiAgcmVzb2x2ZWRUYWlsID0gbm9ybWFsaXplU3RyaW5nKFxuICAgIHJlc29sdmVkVGFpbCxcbiAgICAhcmVzb2x2ZWRBYnNvbHV0ZSxcbiAgICBcIlxcXFxcIixcbiAgICBpc1BhdGhTZXBhcmF0b3IsXG4gICk7XG5cbiAgcmV0dXJuIHJlc29sdmVkRGV2aWNlICsgKHJlc29sdmVkQWJzb2x1dGUgPyBcIlxcXFxcIiA6IFwiXCIpICsgcmVzb2x2ZWRUYWlsIHx8IFwiLlwiO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxVQUFVLFFBQVEsa0JBQWtCO0FBQzdDLFNBQ0UsVUFBVSxFQUNWLGVBQWUsRUFDZixvQkFBb0IsRUFDcEIsbUJBQW1CLEVBQ25CLGVBQWUsUUFDVixhQUFhO0FBRXBCOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxhQUFhLEdBQUcsWUFBc0I7RUFDcEQsSUFBSSxlQUFlO0VBQ25CLElBQUksbUJBQW1CO0VBRXZCLElBQUssSUFBSSxJQUFJLGFBQWEsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsSUFBSztJQUN2RSxJQUFJO0lBRUosSUFBSSxLQUFLLEdBQUcsT0FBTyxZQUFZLENBQUMsRUFBRTtTQUM3QjtNQUNILG1DQUFtQztNQUNuQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUc7TUFDakIsSUFBSSxPQUFPLE1BQU0sUUFBUSxZQUFZO1FBQ25DLE1BQU0sSUFBSSxVQUFVO01BQ3RCO01BQ0EsT0FBTyxLQUFLLEdBQUc7SUFDakI7SUFFQSxXQUFXO0lBRVgscUJBQXFCO0lBQ3JCLElBQUksS0FBSyxNQUFNLEtBQUssR0FBRztNQUNyQjtJQUNGO0lBRUEsZUFBZSxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsYUFBYSxDQUFDO0lBQ3hDLG1CQUFtQixxQkFBcUIsS0FBSyxVQUFVLENBQUM7RUFDMUQ7RUFFQSx5RUFBeUU7RUFDekUsd0VBQXdFO0VBRXhFLHFCQUFxQjtFQUNyQixlQUFlLGdCQUNiLGNBQ0EsQ0FBQyxrQkFDRCxLQUNBO0VBR0YsSUFBSSxrQkFBa0I7SUFDcEIsSUFBSSxh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