// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
/**
 * String formatters and utilities for dealing with ANSI color codes.
 *
 * This module is browser compatible.
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 *
 * @example
 * ```typescript
 * import {
 *   bgBlue,
 *   bgRgb24,
 *   bgRgb8,
 *   bold,
 *   italic,
 *   red,
 *   rgb24,
 *   rgb8,
 * } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *
 * console.log(bgBlue(italic(red(bold("Hello, World!")))));
 *
 * // also supports 8bit colors
 *
 * console.log(rgb8("Hello, World!", 42));
 *
 * console.log(bgRgb8("Hello, World!", 42));
 *
 * // and 24bit rgb
 *
 * console.log(rgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 *
 * console.log(bgRgb24("Hello, World!", {
 *   r: 41,
 *   g: 42,
 *   b: 43,
 * }));
 * ```
 *
 * @module
 */ // deno-lint-ignore no-explicit-any
const { Deno } = globalThis;
const noColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : false;
let enabled = !noColor;
/**
 * Set changing text color to enabled or disabled
 * @param value
 */ export function setColorEnabled(value) {
  if (Deno?.noColor) {
    return;
  }
  enabled = value;
}
/** Get whether text color change is enabled or disabled. */ export function getColorEnabled() {
  return enabled;
}
/**
 * Builds color code
 * @param open
 * @param close
 */ function code(open, close) {
  return {
    open: `\x1b[${open.join(";")}m`,
    close: `\x1b[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g")
  };
}
/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */ function run(str, code) {
  return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
/**
 * Reset the text modified
 * @param str text to reset
 */ export function reset(str) {
  return run(str, code([
    0
  ], 0));
}
/**
 * Make the text bold.
 * @param str text to make bold
 */ export function bold(str) {
  return run(str, code([
    1
  ], 22));
}
/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */ export function dim(str) {
  return run(str, code([
    2
  ], 22));
}
/**
 * Make the text italic.
 * @param str text to make italic
 */ export function italic(str) {
  return run(str, code([
    3
  ], 23));
}
/**
 * Make the text underline.
 * @param str text to underline
 */ export function underline(str) {
  return run(str, code([
    4
  ], 24));
}
/**
 * Invert background color and text color.
 * @param str text to invert its color
 */ export function inverse(str) {
  return run(str, code([
    7
  ], 27));
}
/**
 * Make the text hidden.
 * @param str text to hide
 */ export function hidden(str) {
  return run(str, code([
    8
  ], 28));
}
/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */ export function strikethrough(str) {
  return run(str, code([
    9
  ], 29));
}
/**
 * Set text color to black.
 * @param str text to make black
 */ export function black(str) {
  return run(str, code([
    30
  ], 39));
}
/**
 * Set text color to red.
 * @param str text to make red
 */ export function red(str) {
  return run(str, code([
    31
  ], 39));
}
/**
 * Set text color to green.
 * @param str text to make green
 */ export function green(str) {
  return run(str, code([
    32
  ], 39));
}
/**
 * Set text color to yellow.
 * @param str text to make yellow
 */ export function yellow(str) {
  return run(str, code([
    33
  ], 39));
}
/**
 * Set text color to blue.
 * @param str text to make blue
 */ export function blue(str) {
  return run(str, code([
    34
  ], 39));
}
/**
 * Set text color to magenta.
 * @param str text to make magenta
 */ export function magenta(str) {
  return run(str, code([
    35
  ], 39));
}
/**
 * Set text color to cyan.
 * @param str text to make cyan
 */ export function cyan(str) {
  return run(str, code([
    36
  ], 39));
}
/**
 * Set text color to white.
 * @param str text to make white
 */ export function white(str) {
  return run(str, code([
    37
  ], 39));
}
/**
 * Set text color to gray.
 * @param str text to make gray
 */ export function gray(str) {
  return brightBlack(str);
}
/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */ export function brightBlack(str) {
  return run(str, code([
    90
  ], 39));
}
/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */ export function brightRed(str) {
  return run(str, code([
    91
  ], 39));
}
/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */ export function brightGreen(str) {
  return run(str, code([
    92
  ], 39));
}
/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */ export function brightYellow(str) {
  return run(str, code([
    93
  ], 39));
}
/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */ export function brightBlue(str) {
  return run(str, code([
    94
  ], 39));
}
/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */ export function brightMagenta(str) {
  return run(str, code([
    95
  ], 39));
}
/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */ export function brightCyan(str) {
  return run(str, code([
    96
  ], 39));
}
/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */ export function brightWhite(str) {
  return run(str, code([
    97
  ], 39));
}
/**
 * Set background color to black.
 * @param str text to make its background black
 */ export function bgBlack(str) {
  return run(str, code([
    40
  ], 49));
}
/**
 * Set background color to red.
 * @param str text to make its background red
 */ export function bgRed(str) {
  return run(str, code([
    41
  ], 49));
}
/**
 * Set background color to green.
 * @param str text to make its background green
 */ export function bgGreen(str) {
  return run(str, code([
    42
  ], 49));
}
/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */ export function bgYellow(str) {
  return run(str, code([
    43
  ], 49));
}
/**
 * Set background color to blue.
 * @param str text to make its background blue
 */ export function bgBlue(str) {
  return run(str, code([
    44
  ], 49));
}
/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */ export function bgMagenta(str) {
  return run(str, code([
    45
  ], 49));
}
/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */ export function bgCyan(str) {
  return run(str, code([
    46
  ], 49));
}
/**
 * Set background color to white.
 * @param str text to make its background white
 */ export function bgWhite(str) {
  return run(str, code([
    47
  ], 49));
}
/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */ export function bgBrightBlack(str) {
  return run(str, code([
    100
  ], 49));
}
/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */ export function bgBrightRed(str) {
  return run(str, code([
    101
  ], 49));
}
/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */ export function bgBrightGreen(str) {
  return run(str, code([
    102
  ], 49));
}
/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */ export function bgBrightYellow(str) {
  return run(str, code([
    103
  ], 49));
}
/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */ export function bgBrightBlue(str) {
  return run(str, code([
    104
  ], 49));
}
/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */ export function bgBrightMagenta(str) {
  return run(str, code([
    105
  ], 49));
}
/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */ export function bgBrightCyan(str) {
  return run(str, code([
    106
  ], 49));
}
/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */ export function bgBrightWhite(str) {
  return run(str, code([
    107
  ], 49));
}
/* Special Color Sequences */ /**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */ function clampAndTruncate(n, max = 255, min = 0) {
  return Math.trunc(Math.max(Math.min(n, max), min));
}
/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */ export function rgb8(str, color) {
  return run(str, code([
    38,
    5,
    clampAndTruncate(color)
  ], 39));
}
/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */ export function bgRgb8(str, color) {
  return run(str, code([
    48,
    5,
    clampAndTruncate(color)
  ], 49));
}
/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { rgb24 } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function rgb24(str, color) {
  if (typeof color === "number") {
    return run(str, code([
      38,
      2,
      color >> 16 & 0xff,
      color >> 8 & 0xff,
      color & 0xff
    ], 39));
  }
  return run(str, code([
    38,
    2,
    clampAndTruncate(color.r),
    clampAndTruncate(color.g),
    clampAndTruncate(color.b)
  ], 39));
}
/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { bgRgb24 } from "https://deno.land/std@$STD_VERSION/fmt/colors.ts";
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function bgRgb24(str, color) {
  if (typeof color === "number") {
    return run(str, code([
      48,
      2,
      color >> 16 & 0xff,
      color >> 8 & 0xff,
      color & 0xff
    ], 49));
  }
  return run(str, code([
    48,
    2,
    clampAndTruncate(color.r),
    clampAndTruncate(color.g),
    clampAndTruncate(color.b)
  ], 49));
}
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp([
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))"
].join("|"), "g");
/**
 * @deprecated (will be removed in 1.0.0) Use `stripAnsiCode` instead.
 *
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */ export const stripColor = stripAnsiCode;
/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */ export function stripAnsiCode(string) {
  return string.replace(ANSI_PATTERN, "");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2ZtdC9jb2xvcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbi8vIEEgbW9kdWxlIHRvIHByaW50IEFOU0kgdGVybWluYWwgY29sb3JzLiBJbnNwaXJlZCBieSBjaGFsaywga2xldXIsIGFuZCBjb2xvcnNcbi8vIG9uIG5wbS5cblxuLyoqXG4gKiBTdHJpbmcgZm9ybWF0dGVycyBhbmQgdXRpbGl0aWVzIGZvciBkZWFsaW5nIHdpdGggQU5TSSBjb2xvciBjb2Rlcy5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4gKlxuICogVGhpcyBtb2R1bGUgc3VwcG9ydHMgYE5PX0NPTE9SYCBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIGRpc2FibGluZyBhbnkgY29sb3JpbmdcbiAqIGlmIGBOT19DT0xPUmAgaXMgc2V0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge1xuICogICBiZ0JsdWUsXG4gKiAgIGJnUmdiMjQsXG4gKiAgIGJnUmdiOCxcbiAqICAgYm9sZCxcbiAqICAgaXRhbGljLFxuICogICByZWQsXG4gKiAgIHJnYjI0LFxuICogICByZ2I4LFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mbXQvY29sb3JzLnRzXCI7XG4gKlxuICogY29uc29sZS5sb2coYmdCbHVlKGl0YWxpYyhyZWQoYm9sZChcIkhlbGxvLCBXb3JsZCFcIikpKSkpO1xuICpcbiAqIC8vIGFsc28gc3VwcG9ydHMgOGJpdCBjb2xvcnNcbiAqXG4gKiBjb25zb2xlLmxvZyhyZ2I4KFwiSGVsbG8sIFdvcmxkIVwiLCA0MikpO1xuICpcbiAqIGNvbnNvbGUubG9nKGJnUmdiOChcIkhlbGxvLCBXb3JsZCFcIiwgNDIpKTtcbiAqXG4gKiAvLyBhbmQgMjRiaXQgcmdiXG4gKlxuICogY29uc29sZS5sb2cocmdiMjQoXCJIZWxsbywgV29ybGQhXCIsIHtcbiAqICAgcjogNDEsXG4gKiAgIGc6IDQyLFxuICogICBiOiA0MyxcbiAqIH0pKTtcbiAqXG4gKiBjb25zb2xlLmxvZyhiZ1JnYjI0KFwiSGVsbG8sIFdvcmxkIVwiLCB7XG4gKiAgIHI6IDQxLFxuICogICBnOiA0MixcbiAqICAgYjogNDMsXG4gKiB9KSk7XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmNvbnN0IHsgRGVubyB9ID0gZ2xvYmFsVGhpcyBhcyBhbnk7XG5jb25zdCBub0NvbG9yID0gdHlwZW9mIERlbm8/Lm5vQ29sb3IgPT09IFwiYm9vbGVhblwiXG4gID8gRGVuby5ub0NvbG9yIGFzIGJvb2xlYW5cbiAgOiBmYWxzZTtcblxuaW50ZXJmYWNlIENvZGUge1xuICBvcGVuOiBzdHJpbmc7XG4gIGNsb3NlOiBzdHJpbmc7XG4gIHJlZ2V4cDogUmVnRXhwO1xufVxuXG4vKiogUkdCIDgtYml0cyBwZXIgY2hhbm5lbC4gRWFjaCBpbiByYW5nZSBgMC0+MjU1YCBvciBgMHgwMC0+MHhmZmAgKi9cbmludGVyZmFjZSBSZ2Ige1xuICByOiBudW1iZXI7XG4gIGc6IG51bWJlcjtcbiAgYjogbnVtYmVyO1xufVxuXG5sZXQgZW5hYmxlZCA9ICFub0NvbG9yO1xuXG4vKipcbiAqIFNldCBjaGFuZ2luZyB0ZXh0IGNvbG9yIHRvIGVuYWJsZWQgb3IgZGlzYWJsZWRcbiAqIEBwYXJhbSB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29sb3JFbmFibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gIGlmIChEZW5vPy5ub0NvbG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZW5hYmxlZCA9IHZhbHVlO1xufVxuXG4vKiogR2V0IHdoZXRoZXIgdGV4dCBjb2xvciBjaGFuZ2UgaXMgZW5hYmxlZCBvciBkaXNhYmxlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb2xvckVuYWJsZWQoKTogYm9vbGVhbiB7XG4gIHJldHVybiBlbmFibGVkO1xufVxuXG4vKipcbiAqIEJ1aWxkcyBjb2xvciBjb2RlXG4gKiBAcGFyYW0gb3BlblxuICogQHBhcmFtIGNsb3NlXG4gKi9cbmZ1bmN0aW9uIGNvZGUob3BlbjogbnVtYmVyW10sIGNsb3NlOiBudW1iZXIpOiBDb2RlIHtcbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBgXFx4MWJbJHtvcGVuLmpvaW4oXCI7XCIpfW1gLFxuICAgIGNsb3NlOiBgXFx4MWJbJHtjbG9zZX1tYCxcbiAgICByZWdleHA6IG5ldyBSZWdFeHAoYFxcXFx4MWJcXFxcWyR7Y2xvc2V9bWAsIFwiZ1wiKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGNvbG9yIGFuZCBiYWNrZ3JvdW5kIGJhc2VkIG9uIGNvbG9yIGNvZGUgYW5kIGl0cyBhc3NvY2lhdGVkIHRleHRcbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBhcHBseSBjb2xvciBzZXR0aW5ncyB0b1xuICogQHBhcmFtIGNvZGUgY29sb3IgY29kZSB0byBhcHBseVxuICovXG5mdW5jdGlvbiBydW4oc3RyOiBzdHJpbmcsIGNvZGU6IENvZGUpOiBzdHJpbmcge1xuICByZXR1cm4gZW5hYmxlZFxuICAgID8gYCR7Y29kZS5vcGVufSR7c3RyLnJlcGxhY2UoY29kZS5yZWdleHAsIGNvZGUub3Blbil9JHtjb2RlLmNsb3NlfWBcbiAgICA6IHN0cjtcbn1cblxuLyoqXG4gKiBSZXNldCB0aGUgdGV4dCBtb2RpZmllZFxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIHJlc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFswXSwgMCkpO1xufVxuXG4vKipcbiAqIE1ha2UgdGhlIHRleHQgYm9sZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJvbGRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJvbGQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMV0sIDIyKSk7XG59XG5cbi8qKlxuICogVGhlIHRleHQgZW1pdHMgb25seSBhIHNtYWxsIGFtb3VudCBvZiBsaWdodC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBkaW1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpbShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsyXSwgMjIpKTtcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IGl0YWxpYy5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0YWxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXRhbGljKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzNdLCAyMykpO1xufVxuXG4vKipcbiAqIE1ha2UgdGhlIHRleHQgdW5kZXJsaW5lLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIHVuZGVybGluZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5kZXJsaW5lKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzRdLCAyNCkpO1xufVxuXG4vKipcbiAqIEludmVydCBiYWNrZ3JvdW5kIGNvbG9yIGFuZCB0ZXh0IGNvbG9yLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIGludmVydCBpdHMgY29sb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludmVyc2Uoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbN10sIDI3KSk7XG59XG5cbi8qKlxuICogTWFrZSB0aGUgdGV4dCBoaWRkZW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gaGlkZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGlkZGVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzhdLCAyOCkpO1xufVxuXG4vKipcbiAqIFB1dCBob3Jpem9udGFsIGxpbmUgdGhyb3VnaCB0aGUgY2VudGVyIG9mIHRoZSB0ZXh0LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIHN0cmlrZSB0aHJvdWdoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpa2V0aHJvdWdoKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzldLCAyOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJsYWNrLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsYWNrKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMwXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSByZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMV0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gZ3JlZW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBncmVlblxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzJdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHllbGxvdy5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIHllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24geWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMzXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYmx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmx1ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszNF0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gbWFnZW50YS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIG1hZ2VudGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hZ2VudGEoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzVdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGN5YW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBjeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM2XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIHdoaXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGl0ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszN10sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gZ3JheS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGdyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyYXkoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYnJpZ2h0QmxhY2soc3RyKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEJsYWNrKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzkwXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgcmVkLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LXJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0UmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzkxXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgZ3JlZW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzkyXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgeWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LXllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0WWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzkzXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgYmx1ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1ibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRCbHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzk0XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgbWFnZW50YS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1tYWdlbnRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRNYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzk1XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1jeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRDeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzk2XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgd2hpdGUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtd2hpdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodFdoaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzk3XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBibGFjay5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJsYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JsYWNrKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQwXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCByZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnUmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQxXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBncmVlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGdyZWVuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0dyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQyXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byB5ZWxsb3cuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCB5ZWxsb3dcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnWWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQzXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYmx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCbHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ0XSwgNDkpKTtcbn1cblxuLyoqXG4gKiAgU2V0IGJhY2tncm91bmQgY29sb3IgdG8gbWFnZW50YS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIG1hZ2VudGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnTWFnZW50YShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0NV0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGN5YW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQ3lhbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0Nl0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gd2hpdGUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCB3aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdXaGl0ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0N10sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IGJsYWNrLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LWJsYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEJsYWNrKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwMF0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IHJlZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1yZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0UmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwMV0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LWdyZWVuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwMl0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IHllbGxvdy5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC15ZWxsb3dcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0WWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwM10sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IGJsdWUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtYmx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRCbHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwNF0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IG1hZ2VudGEuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRNYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwNV0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IGN5YW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtY3lhblxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRDeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwNl0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IHdoaXRlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LXdoaXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodFdoaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwN10sIDQ5KSk7XG59XG5cbi8qIFNwZWNpYWwgQ29sb3IgU2VxdWVuY2VzICovXG5cbi8qKlxuICogQ2xhbSBhbmQgdHJ1bmNhdGUgY29sb3IgY29kZXNcbiAqIEBwYXJhbSBuXG4gKiBAcGFyYW0gbWF4IG51bWJlciB0byB0cnVuY2F0ZSB0b1xuICogQHBhcmFtIG1pbiBudW1iZXIgdG8gdHJ1bmNhdGUgZnJvbVxuICovXG5mdW5jdGlvbiBjbGFtcEFuZFRydW5jYXRlKG46IG51bWJlciwgbWF4ID0gMjU1LCBtaW4gPSAwKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgudHJ1bmMoTWF0aC5tYXgoTWF0aC5taW4obiwgbWF4KSwgbWluKSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdXNpbmcgcGFsZXR0ZWQgOGJpdCBjb2xvcnMuXG4gKiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlIzgtYml0XG4gKiBAcGFyYW0gc3RyIHRleHQgY29sb3IgdG8gYXBwbHkgcGFsZXR0ZWQgOGJpdCBjb2xvcnMgdG9cbiAqIEBwYXJhbSBjb2xvciBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2I4KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM4LCA1LCBjbGFtcEFuZFRydW5jYXRlKGNvbG9yKV0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdXNpbmcgcGFsZXR0ZWQgOGJpdCBjb2xvcnMuXG4gKiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlIzgtYml0XG4gKiBAcGFyYW0gc3RyIHRleHQgY29sb3IgdG8gYXBwbHkgcGFsZXR0ZWQgOGJpdCBiYWNrZ3JvdW5kIGNvbG9ycyB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnUmdiOChzdHI6IHN0cmluZywgY29sb3I6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0OCwgNSwgY2xhbXBBbmRUcnVuY2F0ZShjb2xvcildLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHVzaW5nIDI0Yml0IHJnYi5cbiAqIGBjb2xvcmAgY2FuIGJlIGEgbnVtYmVyIGluIHJhbmdlIGAweDAwMDAwMGAgdG8gYDB4ZmZmZmZmYCBvclxuICogYW4gYFJnYmAuXG4gKlxuICogVG8gcHJvZHVjZSB0aGUgY29sb3IgbWFnZW50YTpcbiAqXG4gKiBgYGB0c1xuICogICAgICBpbXBvcnQgeyByZ2IyNCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZtdC9jb2xvcnMudHNcIjtcbiAqICAgICAgcmdiMjQoXCJmb29cIiwgMHhmZjAwZmYpO1xuICogICAgICByZ2IyNChcImZvb1wiLCB7cjogMjU1LCBnOiAwLCBiOiAyNTV9KTtcbiAqIGBgYFxuICogQHBhcmFtIHN0ciB0ZXh0IGNvbG9yIHRvIGFwcGx5IDI0Yml0IHJnYiB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYjI0KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyIHwgUmdiKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjb2xvciA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBydW4oXG4gICAgICBzdHIsXG4gICAgICBjb2RlKFxuICAgICAgICBbMzgsIDIsIChjb2xvciA+PiAxNikgJiAweGZmLCAoY29sb3IgPj4gOCkgJiAweGZmLCBjb2xvciAmIDB4ZmZdLFxuICAgICAgICAzOSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcnVuKFxuICAgIHN0cixcbiAgICBjb2RlKFxuICAgICAgW1xuICAgICAgICAzOCxcbiAgICAgICAgMixcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5yKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5nKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5iKSxcbiAgICAgIF0sXG4gICAgICAzOSxcbiAgICApLFxuICApO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHVzaW5nIDI0Yml0IHJnYi5cbiAqIGBjb2xvcmAgY2FuIGJlIGEgbnVtYmVyIGluIHJhbmdlIGAweDAwMDAwMGAgdG8gYDB4ZmZmZmZmYCBvclxuICogYW4gYFJnYmAuXG4gKlxuICogVG8gcHJvZHVjZSB0aGUgY29sb3IgbWFnZW50YTpcbiAqXG4gKiBgYGB0c1xuICogICAgICBpbXBvcnQgeyBiZ1JnYjI0IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZm10L2NvbG9ycy50c1wiO1xuICogICAgICBiZ1JnYjI0KFwiZm9vXCIsIDB4ZmYwMGZmKTtcbiAqICAgICAgYmdSZ2IyNChcImZvb1wiLCB7cjogMjU1LCBnOiAwLCBiOiAyNTV9KTtcbiAqIGBgYFxuICogQHBhcmFtIHN0ciB0ZXh0IGNvbG9yIHRvIGFwcGx5IDI0Yml0IHJnYiB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnUmdiMjQoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIgfCBSZ2IpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGNvbG9yID09PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIHJ1bihcbiAgICAgIHN0cixcbiAgICAgIGNvZGUoXG4gICAgICAgIFs0OCwgMiwgKGNvbG9yID4+IDE2KSAmIDB4ZmYsIChjb2xvciA+PiA4KSAmIDB4ZmYsIGNvbG9yICYgMHhmZl0sXG4gICAgICAgIDQ5LFxuICAgICAgKSxcbiAgICApO1xuICB9XG4gIHJldHVybiBydW4oXG4gICAgc3RyLFxuICAgIGNvZGUoXG4gICAgICBbXG4gICAgICAgIDQ4LFxuICAgICAgICAyLFxuICAgICAgICBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLnIpLFxuICAgICAgICBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLmcpLFxuICAgICAgICBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLmIpLFxuICAgICAgXSxcbiAgICAgIDQ5LFxuICAgICksXG4gICk7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFsay9hbnNpLXJlZ2V4L2Jsb2IvMDJmYTg5M2Q2MTlkM2RhODU0MTFhY2M4ZmQ0ZTJlZWEwZTk1YTlkOS9pbmRleC5qc1xuY29uc3QgQU5TSV9QQVRURVJOID0gbmV3IFJlZ0V4cChcbiAgW1xuICAgIFwiW1xcXFx1MDAxQlxcXFx1MDA5Ql1bW1xcXFxdKCkjOz9dKig/Oig/Oig/Oig/OjtbLWEtekEtWlxcXFxkXFxcXC8jJi46PT8lQH5fXSspKnxbYS16QS1aXFxcXGRdKyg/OjtbLWEtekEtWlxcXFxkXFxcXC8jJi46PT8lQH5fXSopKik/XFxcXHUwMDA3KVwiLFxuICAgIFwiKD86KD86XFxcXGR7MSw0fSg/OjtcXFxcZHswLDR9KSopP1tcXFxcZEEtUFItVFhaY2YtbnEtdXk9Pjx+XSkpXCIsXG4gIF0uam9pbihcInxcIiksXG4gIFwiZ1wiLFxuKTtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGluIDEuMC4wKSBVc2UgYHN0cmlwQW5zaUNvZGVgIGluc3RlYWQuXG4gKlxuICogUmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb20gdGhlIHN0cmluZy5cbiAqIEBwYXJhbSBzdHJpbmcgdG8gcmVtb3ZlIEFOU0kgZXNjYXBlIGNvZGVzIGZyb21cbiAqL1xuZXhwb3J0IGNvbnN0IHN0cmlwQ29sb3IgPSBzdHJpcEFuc2lDb2RlO1xuXG4vKipcbiAqIFJlbW92ZSBBTlNJIGVzY2FwZSBjb2RlcyBmcm9tIHRoZSBzdHJpbmcuXG4gKiBAcGFyYW0gc3RyaW5nIHRvIHJlbW92ZSBBTlNJIGVzY2FwZSBjb2RlcyBmcm9tXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcEFuc2lDb2RlKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKEFOU0lfUEFUVEVSTiwgXCJcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUNyQywrRUFBK0U7QUFDL0UsVUFBVTtBQUVWOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E2Q0MsR0FFRCxtQ0FBbUM7QUFDbkMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHO0FBQ2pCLE1BQU0sVUFBVSxPQUFPLE1BQU0sWUFBWSxZQUNyQyxLQUFLLE9BQU8sR0FDWjtBQWVKLElBQUksVUFBVSxDQUFDO0FBRWY7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLGdCQUFnQixLQUFjO0VBQzVDLElBQUksTUFBTSxTQUFTO0lBQ2pCO0VBQ0Y7RUFFQSxVQUFVO0FBQ1o7QUFFQSwwREFBMEQsR0FDMUQsT0FBTyxTQUFTO0VBQ2QsT0FBTztBQUNUO0FBRUE7Ozs7Q0FJQyxHQUNELFNBQVMsS0FBSyxJQUFjLEVBQUUsS0FBYTtFQUN6QyxPQUFPO0lBQ0wsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZCLFFBQVEsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUU7RUFDMUM7QUFDRjtBQUVBOzs7O0NBSUMsR0FDRCxTQUFTLElBQUksR0FBVyxFQUFFLElBQVU7RUFDbEMsT0FBTyxVQUNILENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLEtBQUssTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFLEVBQUUsS0FBSyxLQUFLLENBQUMsQ0FBQyxHQUNqRTtBQUNOO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sR0FBVztFQUMvQixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLEtBQUssR0FBVztFQUM5QixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLElBQUksR0FBVztFQUM3QixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sR0FBVztFQUNoQyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLFVBQVUsR0FBVztFQUNuQyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLFFBQVEsR0FBVztFQUNqQyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sR0FBVztFQUNoQyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLGNBQWMsR0FBVztFQUN2QyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRSxFQUFFO0FBQzVCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sR0FBVztFQUMvQixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLElBQUksR0FBVztFQUM3QixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sR0FBVztFQUMvQixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sR0FBVztFQUNoQyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLEtBQUssR0FBVztFQUM5QixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLFFBQVEsR0FBVztFQUNqQyxPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLEtBQUssR0FBVztFQUM5QixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sR0FBVztFQUMvQixPQUFPLElBQUksS0FBSyxLQUFLO0lBQUM7R0FBRyxFQUFFO0FBQzdCO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLEtBQUssR0FBVztFQUM5QixPQUFPLFlBQVk7QUFDckI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsWUFBWSxHQUFXO0VBQ3JDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFXO0VBQ25DLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsWUFBWSxHQUFXO0VBQ3JDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsYUFBYSxHQUFXO0VBQ3RDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsV0FBVyxHQUFXO0VBQ3BDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsY0FBYyxHQUFXO0VBQ3ZDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsV0FBVyxHQUFXO0VBQ3BDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsWUFBWSxHQUFXO0VBQ3JDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFXO0VBQ2pDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsTUFBTSxHQUFXO0VBQy9CLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFXO0VBQ2pDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsU0FBUyxHQUFXO0VBQ2xDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxHQUFXO0VBQ2hDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFXO0VBQ25DLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsT0FBTyxHQUFXO0VBQ2hDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFXO0VBQ2pDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFHLEVBQUU7QUFDN0I7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsY0FBYyxHQUFXO0VBQ3ZDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFJLEVBQUU7QUFDOUI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsWUFBWSxHQUFXO0VBQ3JDLE9BQU8sSUFBSSxLQUFLLEtBQUs7SUFBQztHQUFJLEVBQUU7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