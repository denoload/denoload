// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { CHAR_COLON, CHAR_DOT } from "./_constants.ts";
import { assertPath, isPathSeparator, isPosixPathSeparator, isWindowsDeviceRoot, stripTrailingSeparators } from "./_util.ts";
/**
 * Return a `ParsedPath` object of the `path`.
 * @param path to process
 */ export function posixParse(path) {
  assertPath(path);
  const ret = {
    root: "",
    dir: "",
    base: "",
    ext: "",
    name: ""
  };
  if (path.length === 0) return ret;
  const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  let start;
  if (isAbsolute) {
    ret.root = "/";
    start = 1;
  } else {
    start = 0;
  }
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  let i = path.length - 1;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0;
  // Get non-dir info
  for(; i >= start; --i){
    const code = path.charCodeAt(i);
    if (isPosixPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
  preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    if (end !== -1) {
      if (startPart === 0 && isAbsolute) {
        ret.base = ret.name = path.slice(1, end);
      } else {
        ret.base = ret.name = path.slice(startPart, end);
      }
    }
    // Fallback to '/' in case there is no basename
    ret.base = ret.base || "/";
  } else {
    if (startPart === 0 && isAbsolute) {
      ret.name = path.slice(1, startDot);
      ret.base = path.slice(1, end);
    } else {
      ret.name = path.slice(startPart, startDot);
      ret.base = path.slice(startPart, end);
    }
    ret.ext = path.slice(startDot, end);
  }
  if (startPart > 0) {
    ret.dir = stripTrailingSeparators(path.slice(0, startPart - 1), isPosixPathSeparator);
  } else if (isAbsolute) ret.dir = "/";
  return ret;
}
/**
 * Return a `ParsedPath` object of the `path`.
 * @param path to process
 */ export function windowsParse(path) {
  assertPath(path);
  const ret = {
    root: "",
    dir: "",
    base: "",
    ext: "",
    name: ""
  };
  const len = path.length;
  if (len === 0) return ret;
  let rootEnd = 0;
  let code = path.charCodeAt(0);
  // Try to match a root
  if (len > 1) {
    if (isPathSeparator(code)) {
      // Possible UNC root
      rootEnd = 1;
      if (isPathSeparator(path.charCodeAt(1))) {
        // Matched double path separator at beginning
        let j = 2;
        let last = j;
        // Match 1 or more non-path separators
        for(; j < len; ++j){
          if (isPathSeparator(path.charCodeAt(j))) break;
        }
        if (j < len && j !== last) {
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
              rootEnd = j;
            } else if (j !== last) {
              // We matched a UNC root with leftovers
              rootEnd = j + 1;
            }
          }
        }
      }
    } else if (isWindowsDeviceRoot(code)) {
      // Possible device root
      if (path.charCodeAt(1) === CHAR_COLON) {
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path.charCodeAt(2))) {
            if (len === 3) {
              // `path` contains just a drive root, exit early to avoid
              // unnecessary work
              ret.root = ret.dir = path;
              ret.base = "\\";
              return ret;
            }
            rootEnd = 3;
          }
        } else {
          // `path` contains just a relative drive root, exit early to avoid
          // unnecessary work
          ret.root = ret.dir = path;
          return ret;
        }
      }
    }
  } else if (isPathSeparator(code)) {
    // `path` contains just a path separator, exit early to avoid
    // unnecessary work
    ret.root = ret.dir = path;
    ret.base = "\\";
    return ret;
  }
  if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
  let startDot = -1;
  let startPart = rootEnd;
  let end = -1;
  let matchedSlash = true;
  let i = path.length - 1;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0;
  // Get non-dir info
  for(; i >= rootEnd; --i){
    code = path.charCodeAt(i);
    if (isPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
  preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    if (end !== -1) {
      ret.base = ret.name = path.slice(startPart, end);
    }
  } else {
    ret.name = path.slice(startPart, startDot);
    ret.base = path.slice(startPart, end);
    ret.ext = path.slice(startDot, end);
  }
  // Fallback to '\' in case there is no basename
  ret.base = ret.base || "\\";
  // If the directory is the root, use the entire root as the `dir` including
  // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
  // trailing slash (`C:\abc\def` -> `C:\abc`).
  if (startPart > 0 && startPart !== rootEnd) {
    ret.dir = path.slice(0, startPart - 1);
  } else ret.dir = ret.root;
  return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvX3BhcnNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IENIQVJfQ09MT04sIENIQVJfRE9UIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgUGFyc2VkUGF0aCB9IGZyb20gXCIuL19pbnRlcmZhY2UudHNcIjtcbmltcG9ydCB7XG4gIGFzc2VydFBhdGgsXG4gIGlzUGF0aFNlcGFyYXRvcixcbiAgaXNQb3NpeFBhdGhTZXBhcmF0b3IsXG4gIGlzV2luZG93c0RldmljZVJvb3QsXG4gIHN0cmlwVHJhaWxpbmdTZXBhcmF0b3JzLFxufSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKipcbiAqIFJldHVybiBhIGBQYXJzZWRQYXRoYCBvYmplY3Qgb2YgdGhlIGBwYXRoYC5cbiAqIEBwYXJhbSBwYXRoIHRvIHByb2Nlc3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvc2l4UGFyc2UocGF0aDogc3RyaW5nKTogUGFyc2VkUGF0aCB7XG4gIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgY29uc3QgcmV0OiBQYXJzZWRQYXRoID0geyByb290OiBcIlwiLCBkaXI6IFwiXCIsIGJhc2U6IFwiXCIsIGV4dDogXCJcIiwgbmFtZTogXCJcIiB9O1xuICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiByZXQ7XG4gIGNvbnN0IGlzQWJzb2x1dGUgPSBpc1Bvc2l4UGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMCkpO1xuICBsZXQgc3RhcnQ6IG51bWJlcjtcbiAgaWYgKGlzQWJzb2x1dGUpIHtcbiAgICByZXQucm9vdCA9IFwiL1wiO1xuICAgIHN0YXJ0ID0gMTtcbiAgfSBlbHNlIHtcbiAgICBzdGFydCA9IDA7XG4gIH1cbiAgbGV0IHN0YXJ0RG90ID0gLTE7XG4gIGxldCBzdGFydFBhcnQgPSAwO1xuICBsZXQgZW5kID0gLTE7XG4gIGxldCBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICBsZXQgaSA9IHBhdGgubGVuZ3RoIC0gMTtcblxuICAvLyBUcmFjayB0aGUgc3RhdGUgb2YgY2hhcmFjdGVycyAoaWYgYW55KSB3ZSBzZWUgYmVmb3JlIG91ciBmaXJzdCBkb3QgYW5kXG4gIC8vIGFmdGVyIGFueSBwYXRoIHNlcGFyYXRvciB3ZSBmaW5kXG4gIGxldCBwcmVEb3RTdGF0ZSA9IDA7XG5cbiAgLy8gR2V0IG5vbi1kaXIgaW5mb1xuICBmb3IgKDsgaSA+PSBzdGFydDsgLS1pKSB7XG4gICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoaXNQb3NpeFBhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gQ0hBUl9ET1QpIHtcbiAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSkgc3RhcnREb3QgPSBpO1xuICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICBzdGFydERvdCA9PT0gLTEgfHxcbiAgICBlbmQgPT09IC0xIHx8XG4gICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAocHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpXG4gICkge1xuICAgIGlmIChlbmQgIT09IC0xKSB7XG4gICAgICBpZiAoc3RhcnRQYXJ0ID09PSAwICYmIGlzQWJzb2x1dGUpIHtcbiAgICAgICAgcmV0LmJhc2UgPSByZXQubmFtZSA9IHBhdGguc2xpY2UoMSwgZW5kKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRmFsbGJhY2sgdG8gJy8nIGluIGNhc2UgdGhlcmUgaXMgbm8gYmFzZW5hbWVcbiAgICByZXQuYmFzZSA9IHJldC5iYXNlIHx8IFwiL1wiO1xuICB9IGVsc2Uge1xuICAgIGlmIChzdGFydFBhcnQgPT09IDAgJiYgaXNBYnNvbHV0ZSkge1xuICAgICAgcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKDEsIHN0YXJ0RG90KTtcbiAgICAgIHJldC5iYXNlID0gcGF0aC5zbGljZSgxLCBlbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBzdGFydERvdCk7XG4gICAgICByZXQuYmFzZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBlbmQpO1xuICAgIH1cbiAgICByZXQuZXh0ID0gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgfVxuXG4gIGlmIChzdGFydFBhcnQgPiAwKSB7XG4gICAgcmV0LmRpciA9IHN0cmlwVHJhaWxpbmdTZXBhcmF0b3JzKFxuICAgICAgcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKSxcbiAgICAgIGlzUG9zaXhQYXRoU2VwYXJhdG9yLFxuICAgICk7XG4gIH0gZWxzZSBpZiAoaXNBYnNvbHV0ZSkgcmV0LmRpciA9IFwiL1wiO1xuXG4gIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgYFBhcnNlZFBhdGhgIG9iamVjdCBvZiB0aGUgYHBhdGhgLlxuICogQHBhcmFtIHBhdGggdG8gcHJvY2Vzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gd2luZG93c1BhcnNlKHBhdGg6IHN0cmluZyk6IFBhcnNlZFBhdGgge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gIGNvbnN0IHJldDogUGFyc2VkUGF0aCA9IHsgcm9vdDogXCJcIiwgZGlyOiBcIlwiLCBiYXNlOiBcIlwiLCBleHQ6IFwiXCIsIG5hbWU6IFwiXCIgfTtcblxuICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIHJldDtcblxuICBsZXQgcm9vdEVuZCA9IDA7XG4gIGxldCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuXG4gIC8vIFRyeSB0byBtYXRjaCBhIHJvb3RcbiAgaWYgKGxlbiA+IDEpIHtcbiAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBVTkMgcm9vdFxuXG4gICAgICByb290RW5kID0gMTtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBwYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICBpZiAoIWlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChqID09PSBsZW4pIHtcbiAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IG9ubHlcblxuICAgICAgICAgICAgICByb290RW5kID0gajtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICByb290RW5kID0gaiArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGNvZGUpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBkZXZpY2Ugcm9vdFxuXG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSB7XG4gICAgICAgIHJvb3RFbmQgPSAyO1xuICAgICAgICBpZiAobGVuID4gMikge1xuICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkge1xuICAgICAgICAgICAgaWYgKGxlbiA9PT0gMykge1xuICAgICAgICAgICAgICAvLyBgcGF0aGAgY29udGFpbnMganVzdCBhIGRyaXZlIHJvb3QsIGV4aXQgZWFybHkgdG8gYXZvaWRcbiAgICAgICAgICAgICAgLy8gdW5uZWNlc3Nhcnkgd29ya1xuICAgICAgICAgICAgICByZXQucm9vdCA9IHJldC5kaXIgPSBwYXRoO1xuICAgICAgICAgICAgICByZXQuYmFzZSA9IFwiXFxcXFwiO1xuICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm9vdEVuZCA9IDM7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgcmVsYXRpdmUgZHJpdmUgcm9vdCwgZXhpdCBlYXJseSB0byBhdm9pZFxuICAgICAgICAgIC8vIHVubmVjZXNzYXJ5IHdvcmtcbiAgICAgICAgICByZXQucm9vdCA9IHJldC5kaXIgPSBwYXRoO1xuICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBwYXRoIHNlcGFyYXRvciwgZXhpdCBlYXJseSB0byBhdm9pZFxuICAgIC8vIHVubmVjZXNzYXJ5IHdvcmtcbiAgICByZXQucm9vdCA9IHJldC5kaXIgPSBwYXRoO1xuICAgIHJldC5iYXNlID0gXCJcXFxcXCI7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIGlmIChyb290RW5kID4gMCkgcmV0LnJvb3QgPSBwYXRoLnNsaWNlKDAsIHJvb3RFbmQpO1xuXG4gIGxldCBzdGFydERvdCA9IC0xO1xuICBsZXQgc3RhcnRQYXJ0ID0gcm9vdEVuZDtcbiAgbGV0IGVuZCA9IC0xO1xuICBsZXQgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgbGV0IGkgPSBwYXRoLmxlbmd0aCAtIDE7XG5cbiAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxuICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICBsZXQgcHJlRG90U3RhdGUgPSAwO1xuXG4gIC8vIEdldCBub24tZGlyIGluZm9cbiAgZm9yICg7IGkgPj0gcm9vdEVuZDsgLS1pKSB7XG4gICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IENIQVJfRE9UKSB7XG4gICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpIHN0YXJ0RG90ID0gaTtcbiAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKSBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICB9XG4gIH1cblxuICBpZiAoXG4gICAgc3RhcnREb3QgPT09IC0xIHx8XG4gICAgZW5kID09PSAtMSB8fFxuICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXG4gICAgKHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKVxuICApIHtcbiAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgcmV0LmJhc2UgPSByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBlbmQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBzdGFydERvdCk7XG4gICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICByZXQuZXh0ID0gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvICdcXCcgaW4gY2FzZSB0aGVyZSBpcyBubyBiYXNlbmFtZVxuICByZXQuYmFzZSA9IHJldC5iYXNlIHx8IFwiXFxcXFwiO1xuXG4gIC8vIElmIHRoZSBkaXJlY3RvcnkgaXMgdGhlIHJvb3QsIHVzZSB0aGUgZW50aXJlIHJvb3QgYXMgdGhlIGBkaXJgIGluY2x1ZGluZ1xuICAvLyB0aGUgdHJhaWxpbmcgc2xhc2ggaWYgYW55IChgQzpcXGFiY2AgLT4gYEM6XFxgKS4gT3RoZXJ3aXNlLCBzdHJpcCBvdXQgdGhlXG4gIC8vIHRyYWlsaW5nIHNsYXNoIChgQzpcXGFiY1xcZGVmYCAtPiBgQzpcXGFiY2ApLlxuICBpZiAoc3RhcnRQYXJ0ID4gMCAmJiBzdGFydFBhcnQgIT09IHJvb3RFbmQpIHtcbiAgICByZXQuZGlyID0gcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKTtcbiAgfSBlbHNlIHJldC5kaXIgPSByZXQucm9vdDtcblxuICByZXR1cm4gcmV0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxVQUFVLEVBQUUsUUFBUSxRQUFRLGtCQUFrQjtBQUV2RCxTQUNF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