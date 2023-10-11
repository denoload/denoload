// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { CHAR_COLON } from "./_constants.ts";
import { assertPath, isPathSeparator, isPosixPathSeparator, isWindowsDeviceRoot, normalizeString } from "./_util.ts";
function assertArg(path) {
  assertPath(path);
  if (path.length === 0) return ".";
}
/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 * @param path to be normalized
 */ export function posixNormalize(path) {
  assertArg(path);
  const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  const trailingSeparator = isPosixPathSeparator(path.charCodeAt(path.length - 1));
  // Normalize the path
  path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
  if (path.length === 0 && !isAbsolute) path = ".";
  if (path.length > 0 && trailingSeparator) path += "/";
  if (isAbsolute) return `/${path}`;
  return path;
}
/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 * @param path to be normalized
 */ export function windowsNormalize(path) {
  assertArg(path);
  const len = path.length;
  let rootEnd = 0;
  let device;
  let isAbsolute = false;
  const code = path.charCodeAt(0);
  // Try to match a root
  if (len > 1) {
    if (isPathSeparator(code)) {
      // Possible UNC root
      // If we started with a separator, we know we at least have an absolute
      // path of some kind (UNC or otherwise)
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
              // Return the normalized version of the UNC root since there
              // is nothing left to process
              return `\\\\${firstPart}\\${path.slice(last)}\\`;
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
    // `path` contains just a path separator, exit early to avoid unnecessary
    // work
    return "\\";
  }
  let tail;
  if (rootEnd < len) {
    tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
  } else {
    tail = "";
  }
  if (tail.length === 0 && !isAbsolute) tail = ".";
  if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
    tail += "\\";
  }
  if (device === undefined) {
    if (isAbsolute) {
      if (tail.length > 0) return `\\${tail}`;
      else return "\\";
    } else if (tail.length > 0) {
      return tail;
    } else {
      return "";
    }
  } else if (isAbsolute) {
    if (tail.length > 0) return `${device}\\${tail}`;
    else return `${device}\\`;
  } else if (tail.length > 0) {
    return device + tail;
  } else {
    return device;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvX25vcm1hbGl6ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBDSEFSX0NPTE9OIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHtcbiAgYXNzZXJ0UGF0aCxcbiAgaXNQYXRoU2VwYXJhdG9yLFxuICBpc1Bvc2l4UGF0aFNlcGFyYXRvcixcbiAgaXNXaW5kb3dzRGV2aWNlUm9vdCxcbiAgbm9ybWFsaXplU3RyaW5nLFxufSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG5mdW5jdGlvbiBhc3NlcnRBcmcocGF0aDogc3RyaW5nKSB7XG4gIGFzc2VydFBhdGgocGF0aCk7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiLlwiO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgYHBhdGhgLCByZXNvbHZpbmcgYCcuLidgIGFuZCBgJy4nYCBzZWdtZW50cy5cbiAqIE5vdGUgdGhhdCByZXNvbHZpbmcgdGhlc2Ugc2VnbWVudHMgZG9lcyBub3QgbmVjZXNzYXJpbHkgbWVhbiB0aGF0IGFsbCB3aWxsIGJlIGVsaW1pbmF0ZWQuXG4gKiBBIGAnLi4nYCBhdCB0aGUgdG9wLWxldmVsIHdpbGwgYmUgcHJlc2VydmVkLCBhbmQgYW4gZW1wdHkgcGF0aCBpcyBjYW5vbmljYWxseSBgJy4nYC5cbiAqIEBwYXJhbSBwYXRoIHRvIGJlIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvc2l4Tm9ybWFsaXplKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGFzc2VydEFyZyhwYXRoKTtcblxuICBjb25zdCBpc0Fic29sdXRlID0gaXNQb3NpeFBhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDApKTtcbiAgY29uc3QgdHJhaWxpbmdTZXBhcmF0b3IgPSBpc1Bvc2l4UGF0aFNlcGFyYXRvcihcbiAgICBwYXRoLmNoYXJDb2RlQXQocGF0aC5sZW5ndGggLSAxKSxcbiAgKTtcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZVN0cmluZyhwYXRoLCAhaXNBYnNvbHV0ZSwgXCIvXCIsIGlzUG9zaXhQYXRoU2VwYXJhdG9yKTtcblxuICBpZiAocGF0aC5sZW5ndGggPT09IDAgJiYgIWlzQWJzb2x1dGUpIHBhdGggPSBcIi5cIjtcbiAgaWYgKHBhdGgubGVuZ3RoID4gMCAmJiB0cmFpbGluZ1NlcGFyYXRvcikgcGF0aCArPSBcIi9cIjtcblxuICBpZiAoaXNBYnNvbHV0ZSkgcmV0dXJuIGAvJHtwYXRofWA7XG4gIHJldHVybiBwYXRoO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgYHBhdGhgLCByZXNvbHZpbmcgYCcuLidgIGFuZCBgJy4nYCBzZWdtZW50cy5cbiAqIE5vdGUgdGhhdCByZXNvbHZpbmcgdGhlc2Ugc2VnbWVudHMgZG9lcyBub3QgbmVjZXNzYXJpbHkgbWVhbiB0aGF0IGFsbCB3aWxsIGJlIGVsaW1pbmF0ZWQuXG4gKiBBIGAnLi4nYCBhdCB0aGUgdG9wLWxldmVsIHdpbGwgYmUgcHJlc2VydmVkLCBhbmQgYW4gZW1wdHkgcGF0aCBpcyBjYW5vbmljYWxseSBgJy4nYC5cbiAqIEBwYXJhbSBwYXRoIHRvIGJlIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpbmRvd3NOb3JtYWxpemUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0QXJnKHBhdGgpO1xuXG4gIGNvbnN0IGxlbiA9IHBhdGgubGVuZ3RoO1xuICBsZXQgcm9vdEVuZCA9IDA7XG4gIGxldCBkZXZpY2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGlzQWJzb2x1dGUgPSBmYWxzZTtcbiAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcblxuICAvLyBUcnkgdG8gbWF0Y2ggYSByb290XG4gIGlmIChsZW4gPiAxKSB7XG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgVU5DIHJvb3RcblxuICAgICAgLy8gSWYgd2Ugc3RhcnRlZCB3aXRoIGEgc2VwYXJhdG9yLCB3ZSBrbm93IHdlIGF0IGxlYXN0IGhhdmUgYW4gYWJzb2x1dGVcbiAgICAgIC8vIHBhdGggb2Ygc29tZSBraW5kIChVTkMgb3Igb3RoZXJ3aXNlKVxuICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG5cbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdFBhcnQgPSBwYXRoLnNsaWNlKGxhc3QsIGopO1xuICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIHBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGogPT09IGxlbikge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgb25seVxuICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIG5vcm1hbGl6ZWQgdmVyc2lvbiBvZiB0aGUgVU5DIHJvb3Qgc2luY2UgdGhlcmVcbiAgICAgICAgICAgICAgLy8gaXMgbm90aGluZyBsZWZ0IHRvIHByb2Nlc3NcblxuICAgICAgICAgICAgICByZXR1cm4gYFxcXFxcXFxcJHtmaXJzdFBhcnR9XFxcXCR7cGF0aC5zbGljZShsYXN0KX1cXFxcYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICBkZXZpY2UgPSBgXFxcXFxcXFwke2ZpcnN0UGFydH1cXFxcJHtwYXRoLnNsaWNlKGxhc3QsIGopfWA7XG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdEVuZCA9IDE7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGNvZGUpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBkZXZpY2Ugcm9vdFxuXG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSB7XG4gICAgICAgIGRldmljZSA9IHBhdGguc2xpY2UoMCwgMik7XG4gICAgICAgIHJvb3RFbmQgPSAyO1xuICAgICAgICBpZiAobGVuID4gMikge1xuICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkge1xuICAgICAgICAgICAgLy8gVHJlYXQgc2VwYXJhdG9yIGZvbGxvd2luZyBkcml2ZSBuYW1lIGFzIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIGluZGljYXRvclxuICAgICAgICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG4gICAgICAgICAgICByb290RW5kID0gMztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBwYXRoIHNlcGFyYXRvciwgZXhpdCBlYXJseSB0byBhdm9pZCB1bm5lY2Vzc2FyeVxuICAgIC8vIHdvcmtcbiAgICByZXR1cm4gXCJcXFxcXCI7XG4gIH1cblxuICBsZXQgdGFpbDogc3RyaW5nO1xuICBpZiAocm9vdEVuZCA8IGxlbikge1xuICAgIHRhaWwgPSBub3JtYWxpemVTdHJpbmcoXG4gICAgICBwYXRoLnNsaWNlKHJvb3RFbmQpLFxuICAgICAgIWlzQWJzb2x1dGUsXG4gICAgICBcIlxcXFxcIixcbiAgICAgIGlzUGF0aFNlcGFyYXRvcixcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHRhaWwgPSBcIlwiO1xuICB9XG4gIGlmICh0YWlsLmxlbmd0aCA9PT0gMCAmJiAhaXNBYnNvbHV0ZSkgdGFpbCA9IFwiLlwiO1xuICBpZiAodGFpbC5sZW5ndGggPiAwICYmIGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQobGVuIC0gMSkpKSB7XG4gICAgdGFpbCArPSBcIlxcXFxcIjtcbiAgfVxuICBpZiAoZGV2aWNlID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoaXNBYnNvbHV0ZSkge1xuICAgICAgaWYgKHRhaWwubGVuZ3RoID4gMCkgcmV0dXJuIGBcXFxcJHt0YWlsfWA7XG4gICAgICBlbHNlIHJldHVybiBcIlxcXFxcIjtcbiAgICB9IGVsc2UgaWYgKHRhaWwubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHRhaWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc0Fic29sdXRlKSB7XG4gICAgaWYgKHRhaWwubGVuZ3RoID4gMCkgcmV0dXJuIGAke2RldmljZX1cXFxcJHt0YWlsfWA7XG4gICAgZWxzZSByZXR1cm4gYCR7ZGV2aWNlfVxcXFxgO1xuICB9IGVsc2UgaWYgKHRhaWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBkZXZpY2UgKyB0YWlsO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBkZXZpY2U7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsVUFBVSxRQUFRLGtCQUFrQjtBQUM3QyxTQUNFLFVBQVUsRUFDVixlQUFlLEVBQ2Ysb0JBQW9CLEVBQ3BCLG1CQUFtQixFQUNuQixlQUFlLFFBQ1YsYUFBYTtBQUVwQixTQUFTLFVBQVUsSUFBWTtFQUM3QixXQUFXO0VBQ1gsSUFBSSxLQUFLLE1BQU0sS0FBSyxHQUFHLE9BQU87QUFDaEM7QUFFQTs7Ozs7Q0FLQyxHQUNELE9BQU8sU0FBUyxlQUFlLElBQVk7RUFDekMsVUFBVTtFQUVWLE1BQU0sYUFBYSxxQkFBcUIsS0FBSyxVQUFVLENBQUM7RUFDeEQsTUFBTSxvQkFBb0IscUJBQ3hCLEtBQUssVUFBVSxDQUFDLEtBQUssTUFBTSxHQUFHO0VBR2hDLHFCQUFxQjtFQUNyQixPQUFPLGdCQUFnQixNQUFNLENBQUMsWUFBWSxLQUFLO0VBRS9DLElBQUksS0FBSyxNQUFNLEtBQUssS0FBSyxDQUFDLFlBQVksT0FBTztFQUM3QyxJQUFJLEtBQUssTUFBTSxHQUFHLEtB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