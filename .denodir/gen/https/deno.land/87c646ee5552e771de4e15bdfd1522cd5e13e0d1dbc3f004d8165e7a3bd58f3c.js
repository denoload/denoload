// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows, osType } from "./_os.ts";
import { SEP, SEP_PATTERN } from "./separator.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
const { join, normalize } = path;
const regExpEscapeChars = [
  "!",
  "$",
  "(",
  ")",
  "*",
  "+",
  ".",
  "=",
  "?",
  "[",
  "\\",
  "^",
  "{",
  "|"
];
const rangeEscapeChars = [
  "-",
  "\\",
  "]"
];
/** Convert a glob string to a regular expression.
 *
 * Tries to match bash glob expansion as closely as possible.
 *
 * Basic glob syntax:
 * - `*` - Matches everything without leaving the path segment.
 * - `?` - Matches any single character.
 * - `{foo,bar}` - Matches `foo` or `bar`.
 * - `[abcd]` - Matches `a`, `b`, `c` or `d`.
 * - `[a-d]` - Matches `a`, `b`, `c` or `d`.
 * - `[!abcd]` - Matches any single character besides `a`, `b`, `c` or `d`.
 * - `[[:<class>:]]` - Matches any character belonging to `<class>`.
 *     - `[[:alnum:]]` - Matches any digit or letter.
 *     - `[[:digit:]abc]` - Matches any digit, `a`, `b` or `c`.
 *     - See https://facelessuser.github.io/wcmatch/glob/#posix-character-classes
 *       for a complete list of supported character classes.
 * - `\` - Escapes the next character for an `os` other than `"windows"`.
 * - \` - Escapes the next character for `os` set to `"windows"`.
 * - `/` - Path separator.
 * - `\` - Additional path separator only for `os` set to `"windows"`.
 *
 * Extended syntax:
 * - Requires `{ extended: true }`.
 * - `?(foo|bar)` - Matches 0 or 1 instance of `{foo,bar}`.
 * - `@(foo|bar)` - Matches 1 instance of `{foo,bar}`. They behave the same.
 * - `*(foo|bar)` - Matches _n_ instances of `{foo,bar}`.
 * - `+(foo|bar)` - Matches _n > 0_ instances of `{foo,bar}`.
 * - `!(foo|bar)` - Matches anything other than `{foo,bar}`.
 * - See https://www.linuxjournal.com/content/bash-extended-globbing.
 *
 * Globstar syntax:
 * - Requires `{ globstar: true }`.
 * - `**` - Matches any number of any path segments.
 *     - Must comprise its entire path segment in the provided glob.
 * - See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
 *
 * Note the following properties:
 * - The generated `RegExp` is anchored at both start and end.
 * - Repeating and trailing separators are tolerated. Trailing separators in the
 *   provided glob have no meaning and are discarded.
 * - Absolute globs will only match absolute paths, etc.
 * - Empty globs will match nothing.
 * - Any special glob syntax must be contained to one path segment. For example,
 *   `?(foo|bar/baz)` is invalid. The separator will take precedence and the
 *   first segment ends with an unclosed group.
 * - If a path segment ends with unclosed groups or a dangling escape prefix, a
 *   parse error has occurred. Every character for that segment is taken
 *   literally in this event.
 *
 * Limitations:
 * - A negative group like `!(foo|bar)` will wrongly be converted to a negative
 *   look-ahead followed by a wildcard. This means that `!(foo).js` will wrongly
 *   fail to match `foobar.js`, even though `foobar` is not `foo`. Effectively,
 *   `!(foo|bar)` is treated like `!(@(foo|bar)*)`. This will work correctly if
 *   the group occurs not nested at the end of the segment. */ export function globToRegExp(glob, { extended = true, globstar: globstarOption = true, os = osType, caseInsensitive = false } = {}) {
  if (glob === "") {
    return /(?!)/;
  }
  const sep = os === "windows" ? "(?:\\\\|/)+" : "/+";
  const sepMaybe = os === "windows" ? "(?:\\\\|/)*" : "/*";
  const seps = os === "windows" ? [
    "\\",
    "/"
  ] : [
    "/"
  ];
  const globstar = os === "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
  const wildcard = os === "windows" ? "[^\\\\/]*" : "[^/]*";
  const escapePrefix = os === "windows" ? "`" : "\\";
  // Remove trailing separators.
  let newLength = glob.length;
  for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
  glob = glob.slice(0, newLength);
  let regExpString = "";
  // Terminates correctly. Trust that `j` is incremented every iteration.
  for(let j = 0; j < glob.length;){
    let segment = "";
    const groupStack = [];
    let inRange = false;
    let inEscape = false;
    let endsWithSep = false;
    let i = j;
    // Terminates with `i` at the non-inclusive end of the current segment.
    for(; i < glob.length && !seps.includes(glob[i]); i++){
      if (inEscape) {
        inEscape = false;
        const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
        segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        continue;
      }
      if (glob[i] === escapePrefix) {
        inEscape = true;
        continue;
      }
      if (glob[i] === "[") {
        if (!inRange) {
          inRange = true;
          segment += "[";
          if (glob[i + 1] === "!") {
            i++;
            segment += "^";
          } else if (glob[i + 1] === "^") {
            i++;
            segment += "\\^";
          }
          continue;
        } else if (glob[i + 1] === ":") {
          let k = i + 1;
          let value = "";
          while(glob[k + 1] !== undefined && glob[k + 1] !== ":"){
            value += glob[k + 1];
            k++;
          }
          if (glob[k + 1] === ":" && glob[k + 2] === "]") {
            i = k + 2;
            if (value === "alnum") segment += "\\dA-Za-z";
            else if (value === "alpha") segment += "A-Za-z";
            else if (value === "ascii") segment += "\x00-\x7F";
            else if (value === "blank") segment += "\t ";
            else if (value === "cntrl") segment += "\x00-\x1F\x7F";
            else if (value === "digit") segment += "\\d";
            else if (value === "graph") segment += "\x21-\x7E";
            else if (value === "lower") segment += "a-z";
            else if (value === "print") segment += "\x20-\x7E";
            else if (value === "punct") {
              segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
            } else if (value === "space") segment += "\\s\v";
            else if (value === "upper") segment += "A-Z";
            else if (value === "word") segment += "\\w";
            else if (value === "xdigit") segment += "\\dA-Fa-f";
            continue;
          }
        }
      }
      if (glob[i] === "]" && inRange) {
        inRange = false;
        segment += "]";
        continue;
      }
      if (inRange) {
        if (glob[i] === "\\") {
          segment += `\\\\`;
        } else {
          segment += glob[i];
        }
        continue;
      }
      if (glob[i] === ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] !== "BRACE") {
        segment += ")";
        const type = groupStack.pop();
        if (type === "!") {
          segment += wildcard;
        } else if (type !== "@") {
          segment += type;
        }
        continue;
      }
      if (glob[i] === "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] !== "BRACE") {
        segment += "|";
        continue;
      }
      if (glob[i] === "+" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("+");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "@" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("@");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "?") {
        if (extended && glob[i + 1] === "(") {
          i++;
          groupStack.push("?");
          segment += "(?:";
        } else {
          segment += ".";
        }
        continue;
      }
      if (glob[i] === "!" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("!");
        segment += "(?!";
        continue;
      }
      if (glob[i] === "{") {
        groupStack.push("BRACE");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "}" && groupStack[groupStack.length - 1] === "BRACE") {
        groupStack.pop();
        segment += ")";
        continue;
      }
      if (glob[i] === "," && groupStack[groupStack.length - 1] === "BRACE") {
        segment += "|";
        continue;
      }
      if (glob[i] === "*") {
        if (extended && glob[i + 1] === "(") {
          i++;
          groupStack.push("*");
          segment += "(?:";
        } else {
          const prevChar = glob[i - 1];
          let numStars = 1;
          while(glob[i + 1] === "*"){
            i++;
            numStars++;
          }
          const nextChar = glob[i + 1];
          if (globstarOption && numStars === 2 && [
            ...seps,
            undefined
          ].includes(prevChar) && [
            ...seps,
            undefined
          ].includes(nextChar)) {
            segment += globstar;
            endsWithSep = true;
          } else {
            segment += wildcard;
          }
        }
        continue;
      }
      segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
    }
    // Check for unclosed groups or a dangling backslash.
    if (groupStack.length > 0 || inRange || inEscape) {
      // Parse failure. Take all characters from this segment literally.
      segment = "";
      for (const c of glob.slice(j, i)){
        segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
        endsWithSep = false;
      }
    }
    regExpString += segment;
    if (!endsWithSep) {
      regExpString += i < glob.length ? sep : sepMaybe;
      endsWithSep = true;
    }
    // Terminates with `i` at the start of the next segment.
    while(seps.includes(glob[i]))i++;
    // Check that the next value of `j` is indeed higher than the current value.
    if (!(i > j)) {
      throw new Error("Assertion failure: i > j (potential infinite loop)");
    }
    j = i;
  }
  regExpString = `^${regExpString}$`;
  return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
/** Test whether the given string is a glob */ export function isGlob(str) {
  const chars = {
    "{": "}",
    "(": ")",
    "[": "]"
  };
  const regex = /\\(.)|(^!|\*|\?|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
  if (str === "") {
    return false;
  }
  let match;
  while(match = regex.exec(str)){
    if (match[2]) return true;
    let idx = match.index + match[0].length;
    // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character
    const open = match[1];
    const close = open ? chars[open] : null;
    if (open && close) {
      const n = str.indexOf(close, idx);
      if (n !== -1) {
        idx = n + 1;
      }
    }
    str = str.slice(idx);
  }
  return false;
}
/** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */ export function normalizeGlob(glob, { globstar = false } = {}) {
  if (glob.match(/\0/g)) {
    throw new Error(`Glob contains invalid characters: "${glob}"`);
  }
  if (!globstar) {
    return normalize(glob);
  }
  const s = SEP_PATTERN.source;
  const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
  return normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
/** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */ export function joinGlobs(globs, { extended = true, globstar = false } = {}) {
  if (!globstar || globs.length === 0) {
    return join(...globs);
  }
  if (globs.length === 0) return ".";
  let joined;
  for (const glob of globs){
    const path = glob;
    if (path.length > 0) {
      if (!joined) joined = path;
      else joined += `${SEP}${path}`;
    }
  }
  if (!joined) return ".";
  return normalizeGlob(joined, {
    extended,
    globstar
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvZ2xvYi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MsIHR5cGUgT1NUeXBlLCBvc1R5cGUgfSBmcm9tIFwiLi9fb3MudHNcIjtcbmltcG9ydCB7IFNFUCwgU0VQX1BBVFRFUk4gfSBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcbmltcG9ydCAqIGFzIF93aW4zMiBmcm9tIFwiLi93aW4zMi50c1wiO1xuaW1wb3J0ICogYXMgX3Bvc2l4IGZyb20gXCIuL3Bvc2l4LnRzXCI7XG5cbmNvbnN0IHBhdGggPSBpc1dpbmRvd3MgPyBfd2luMzIgOiBfcG9zaXg7XG5jb25zdCB7IGpvaW4sIG5vcm1hbGl6ZSB9ID0gcGF0aDtcblxuZXhwb3J0IGludGVyZmFjZSBHbG9iT3B0aW9ucyB7XG4gIC8qKiBFeHRlbmRlZCBnbG9iIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9iYXNoLWV4dGVuZGVkLWdsb2JiaW5nLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7dHJ1ZX1cbiAgICovXG4gIGV4dGVuZGVkPzogYm9vbGVhbjtcbiAgLyoqIEdsb2JzdGFyIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gICAqIElmIGZhbHNlLCBgKipgIGlzIHRyZWF0ZWQgbGlrZSBgKmAuXG4gICAqXG4gICAqIEBkZWZhdWx0IHt0cnVlfVxuICAgKi9cbiAgZ2xvYnN0YXI/OiBib29sZWFuO1xuICAvKiogV2hldGhlciBnbG9ic3RhciBzaG91bGQgYmUgY2FzZS1pbnNlbnNpdGl2ZS4gKi9cbiAgY2FzZUluc2Vuc2l0aXZlPzogYm9vbGVhbjtcbiAgLyoqIE9wZXJhdGluZyBzeXN0ZW0uIERlZmF1bHRzIHRvIHRoZSBuYXRpdmUgT1MuICovXG4gIG9zPzogT1NUeXBlO1xufVxuXG5leHBvcnQgdHlwZSBHbG9iVG9SZWdFeHBPcHRpb25zID0gR2xvYk9wdGlvbnM7XG5cbmNvbnN0IHJlZ0V4cEVzY2FwZUNoYXJzID0gW1xuICBcIiFcIixcbiAgXCIkXCIsXG4gIFwiKFwiLFxuICBcIilcIixcbiAgXCIqXCIsXG4gIFwiK1wiLFxuICBcIi5cIixcbiAgXCI9XCIsXG4gIFwiP1wiLFxuICBcIltcIixcbiAgXCJcXFxcXCIsXG4gIFwiXlwiLFxuICBcIntcIixcbiAgXCJ8XCIsXG5dO1xuY29uc3QgcmFuZ2VFc2NhcGVDaGFycyA9IFtcIi1cIiwgXCJcXFxcXCIsIFwiXVwiXTtcblxuLyoqIENvbnZlcnQgYSBnbG9iIHN0cmluZyB0byBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBUcmllcyB0byBtYXRjaCBiYXNoIGdsb2IgZXhwYW5zaW9uIGFzIGNsb3NlbHkgYXMgcG9zc2libGUuXG4gKlxuICogQmFzaWMgZ2xvYiBzeW50YXg6XG4gKiAtIGAqYCAtIE1hdGNoZXMgZXZlcnl0aGluZyB3aXRob3V0IGxlYXZpbmcgdGhlIHBhdGggc2VnbWVudC5cbiAqIC0gYD9gIC0gTWF0Y2hlcyBhbnkgc2luZ2xlIGNoYXJhY3Rlci5cbiAqIC0gYHtmb28sYmFyfWAgLSBNYXRjaGVzIGBmb29gIG9yIGBiYXJgLlxuICogLSBgW2FiY2RdYCAtIE1hdGNoZXMgYGFgLCBgYmAsIGBjYCBvciBgZGAuXG4gKiAtIGBbYS1kXWAgLSBNYXRjaGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgWyFhYmNkXWAgLSBNYXRjaGVzIGFueSBzaW5nbGUgY2hhcmFjdGVyIGJlc2lkZXMgYGFgLCBgYmAsIGBjYCBvciBgZGAuXG4gKiAtIGBbWzo8Y2xhc3M+Ol1dYCAtIE1hdGNoZXMgYW55IGNoYXJhY3RlciBiZWxvbmdpbmcgdG8gYDxjbGFzcz5gLlxuICogICAgIC0gYFtbOmFsbnVtOl1dYCAtIE1hdGNoZXMgYW55IGRpZ2l0IG9yIGxldHRlci5cbiAqICAgICAtIGBbWzpkaWdpdDpdYWJjXWAgLSBNYXRjaGVzIGFueSBkaWdpdCwgYGFgLCBgYmAgb3IgYGNgLlxuICogICAgIC0gU2VlIGh0dHBzOi8vZmFjZWxlc3N1c2VyLmdpdGh1Yi5pby93Y21hdGNoL2dsb2IvI3Bvc2l4LWNoYXJhY3Rlci1jbGFzc2VzXG4gKiAgICAgICBmb3IgYSBjb21wbGV0ZSBsaXN0IG9mIHN1cHBvcnRlZCBjaGFyYWN0ZXIgY2xhc3Nlcy5cbiAqIC0gYFxcYCAtIEVzY2FwZXMgdGhlIG5leHQgY2hhcmFjdGVyIGZvciBhbiBgb3NgIG90aGVyIHRoYW4gYFwid2luZG93c1wiYC5cbiAqIC0gXFxgIC0gRXNjYXBlcyB0aGUgbmV4dCBjaGFyYWN0ZXIgZm9yIGBvc2Agc2V0IHRvIGBcIndpbmRvd3NcImAuXG4gKiAtIGAvYCAtIFBhdGggc2VwYXJhdG9yLlxuICogLSBgXFxgIC0gQWRkaXRpb25hbCBwYXRoIHNlcGFyYXRvciBvbmx5IGZvciBgb3NgIHNldCB0byBgXCJ3aW5kb3dzXCJgLlxuICpcbiAqIEV4dGVuZGVkIHN5bnRheDpcbiAqIC0gUmVxdWlyZXMgYHsgZXh0ZW5kZWQ6IHRydWUgfWAuXG4gKiAtIGA/KGZvb3xiYXIpYCAtIE1hdGNoZXMgMCBvciAxIGluc3RhbmNlIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgQChmb298YmFyKWAgLSBNYXRjaGVzIDEgaW5zdGFuY2Ugb2YgYHtmb28sYmFyfWAuIFRoZXkgYmVoYXZlIHRoZSBzYW1lLlxuICogLSBgKihmb298YmFyKWAgLSBNYXRjaGVzIF9uXyBpbnN0YW5jZXMgb2YgYHtmb28sYmFyfWAuXG4gKiAtIGArKGZvb3xiYXIpYCAtIE1hdGNoZXMgX24gPiAwXyBpbnN0YW5jZXMgb2YgYHtmb28sYmFyfWAuXG4gKiAtIGAhKGZvb3xiYXIpYCAtIE1hdGNoZXMgYW55dGhpbmcgb3RoZXIgdGhhbiBge2ZvbyxiYXJ9YC5cbiAqIC0gU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9iYXNoLWV4dGVuZGVkLWdsb2JiaW5nLlxuICpcbiAqIEdsb2JzdGFyIHN5bnRheDpcbiAqIC0gUmVxdWlyZXMgYHsgZ2xvYnN0YXI6IHRydWUgfWAuXG4gKiAtIGAqKmAgLSBNYXRjaGVzIGFueSBudW1iZXIgb2YgYW55IHBhdGggc2VnbWVudHMuXG4gKiAgICAgLSBNdXN0IGNvbXByaXNlIGl0cyBlbnRpcmUgcGF0aCBzZWdtZW50IGluIHRoZSBwcm92aWRlZCBnbG9iLlxuICogLSBTZWUgaHR0cHM6Ly93d3cubGludXhqb3VybmFsLmNvbS9jb250ZW50L2dsb2JzdGFyLW5ldy1iYXNoLWdsb2JiaW5nLW9wdGlvbi5cbiAqXG4gKiBOb3RlIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAqIC0gVGhlIGdlbmVyYXRlZCBgUmVnRXhwYCBpcyBhbmNob3JlZCBhdCBib3RoIHN0YXJ0IGFuZCBlbmQuXG4gKiAtIFJlcGVhdGluZyBhbmQgdHJhaWxpbmcgc2VwYXJhdG9ycyBhcmUgdG9sZXJhdGVkLiBUcmFpbGluZyBzZXBhcmF0b3JzIGluIHRoZVxuICogICBwcm92aWRlZCBnbG9iIGhhdmUgbm8gbWVhbmluZyBhbmQgYXJlIGRpc2NhcmRlZC5cbiAqIC0gQWJzb2x1dGUgZ2xvYnMgd2lsbCBvbmx5IG1hdGNoIGFic29sdXRlIHBhdGhzLCBldGMuXG4gKiAtIEVtcHR5IGdsb2JzIHdpbGwgbWF0Y2ggbm90aGluZy5cbiAqIC0gQW55IHNwZWNpYWwgZ2xvYiBzeW50YXggbXVzdCBiZSBjb250YWluZWQgdG8gb25lIHBhdGggc2VnbWVudC4gRm9yIGV4YW1wbGUsXG4gKiAgIGA/KGZvb3xiYXIvYmF6KWAgaXMgaW52YWxpZC4gVGhlIHNlcGFyYXRvciB3aWxsIHRha2UgcHJlY2VkZW5jZSBhbmQgdGhlXG4gKiAgIGZpcnN0IHNlZ21lbnQgZW5kcyB3aXRoIGFuIHVuY2xvc2VkIGdyb3VwLlxuICogLSBJZiBhIHBhdGggc2VnbWVudCBlbmRzIHdpdGggdW5jbG9zZWQgZ3JvdXBzIG9yIGEgZGFuZ2xpbmcgZXNjYXBlIHByZWZpeCwgYVxuICogICBwYXJzZSBlcnJvciBoYXMgb2NjdXJyZWQuIEV2ZXJ5IGNoYXJhY3RlciBmb3IgdGhhdCBzZWdtZW50IGlzIHRha2VuXG4gKiAgIGxpdGVyYWxseSBpbiB0aGlzIGV2ZW50LlxuICpcbiAqIExpbWl0YXRpb25zOlxuICogLSBBIG5lZ2F0aXZlIGdyb3VwIGxpa2UgYCEoZm9vfGJhcilgIHdpbGwgd3JvbmdseSBiZSBjb252ZXJ0ZWQgdG8gYSBuZWdhdGl2ZVxuICogICBsb29rLWFoZWFkIGZvbGxvd2VkIGJ5IGEgd2lsZGNhcmQuIFRoaXMgbWVhbnMgdGhhdCBgIShmb28pLmpzYCB3aWxsIHdyb25nbHlcbiAqICAgZmFpbCB0byBtYXRjaCBgZm9vYmFyLmpzYCwgZXZlbiB0aG91Z2ggYGZvb2JhcmAgaXMgbm90IGBmb29gLiBFZmZlY3RpdmVseSxcbiAqICAgYCEoZm9vfGJhcilgIGlzIHRyZWF0ZWQgbGlrZSBgIShAKGZvb3xiYXIpKilgLiBUaGlzIHdpbGwgd29yayBjb3JyZWN0bHkgaWZcbiAqICAgdGhlIGdyb3VwIG9jY3VycyBub3QgbmVzdGVkIGF0IHRoZSBlbmQgb2YgdGhlIHNlZ21lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2xvYlRvUmVnRXhwKFxuICBnbG9iOiBzdHJpbmcsXG4gIHtcbiAgICBleHRlbmRlZCA9IHRydWUsXG4gICAgZ2xvYnN0YXI6IGdsb2JzdGFyT3B0aW9uID0gdHJ1ZSxcbiAgICBvcyA9IG9zVHlwZSxcbiAgICBjYXNlSW5zZW5zaXRpdmUgPSBmYWxzZSxcbiAgfTogR2xvYlRvUmVnRXhwT3B0aW9ucyA9IHt9LFxuKTogUmVnRXhwIHtcbiAgaWYgKGdsb2IgPT09IFwiXCIpIHtcbiAgICByZXR1cm4gLyg/ISkvO1xuICB9XG5cbiAgY29uc3Qgc2VwID0gb3MgPT09IFwid2luZG93c1wiID8gXCIoPzpcXFxcXFxcXHwvKStcIiA6IFwiLytcIjtcbiAgY29uc3Qgc2VwTWF5YmUgPSBvcyA9PT0gXCJ3aW5kb3dzXCIgPyBcIig/OlxcXFxcXFxcfC8pKlwiIDogXCIvKlwiO1xuICBjb25zdCBzZXBzID0gb3MgPT09IFwid2luZG93c1wiID8gW1wiXFxcXFwiLCBcIi9cIl0gOiBbXCIvXCJdO1xuICBjb25zdCBnbG9ic3RhciA9IG9zID09PSBcIndpbmRvd3NcIlxuICAgID8gXCIoPzpbXlxcXFxcXFxcL10qKD86XFxcXFxcXFx8L3wkKSspKlwiXG4gICAgOiBcIig/OlteL10qKD86L3wkKSspKlwiO1xuICBjb25zdCB3aWxkY2FyZCA9IG9zID09PSBcIndpbmRvd3NcIiA/IFwiW15cXFxcXFxcXC9dKlwiIDogXCJbXi9dKlwiO1xuICBjb25zdCBlc2NhcGVQcmVmaXggPSBvcyA9PT0gXCJ3aW5kb3dzXCIgPyBcImBcIiA6IFwiXFxcXFwiO1xuXG4gIC8vIFJlbW92ZSB0cmFpbGluZyBzZXBhcmF0b3JzLlxuICBsZXQgbmV3TGVuZ3RoID0gZ2xvYi5sZW5ndGg7XG4gIGZvciAoOyBuZXdMZW5ndGggPiAxICYmIHNlcHMuaW5jbHVkZXMoZ2xvYltuZXdMZW5ndGggLSAxXSk7IG5ld0xlbmd0aC0tKTtcbiAgZ2xvYiA9IGdsb2Iuc2xpY2UoMCwgbmV3TGVuZ3RoKTtcblxuICBsZXQgcmVnRXhwU3RyaW5nID0gXCJcIjtcblxuICAvLyBUZXJtaW5hdGVzIGNvcnJlY3RseS4gVHJ1c3QgdGhhdCBgamAgaXMgaW5jcmVtZW50ZWQgZXZlcnkgaXRlcmF0aW9uLlxuICBmb3IgKGxldCBqID0gMDsgaiA8IGdsb2IubGVuZ3RoOykge1xuICAgIGxldCBzZWdtZW50ID0gXCJcIjtcbiAgICBjb25zdCBncm91cFN0YWNrOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBpblJhbmdlID0gZmFsc2U7XG4gICAgbGV0IGluRXNjYXBlID0gZmFsc2U7XG4gICAgbGV0IGVuZHNXaXRoU2VwID0gZmFsc2U7XG4gICAgbGV0IGkgPSBqO1xuXG4gICAgLy8gVGVybWluYXRlcyB3aXRoIGBpYCBhdCB0aGUgbm9uLWluY2x1c2l2ZSBlbmQgb2YgdGhlIGN1cnJlbnQgc2VnbWVudC5cbiAgICBmb3IgKDsgaSA8IGdsb2IubGVuZ3RoICYmICFzZXBzLmluY2x1ZGVzKGdsb2JbaV0pOyBpKyspIHtcbiAgICAgIGlmIChpbkVzY2FwZSkge1xuICAgICAgICBpbkVzY2FwZSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBlc2NhcGVDaGFycyA9IGluUmFuZ2UgPyByYW5nZUVzY2FwZUNoYXJzIDogcmVnRXhwRXNjYXBlQ2hhcnM7XG4gICAgICAgIHNlZ21lbnQgKz0gZXNjYXBlQ2hhcnMuaW5jbHVkZXMoZ2xvYltpXSkgPyBgXFxcXCR7Z2xvYltpXX1gIDogZ2xvYltpXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBlc2NhcGVQcmVmaXgpIHtcbiAgICAgICAgaW5Fc2NhcGUgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT09IFwiW1wiKSB7XG4gICAgICAgIGlmICghaW5SYW5nZSkge1xuICAgICAgICAgIGluUmFuZ2UgPSB0cnVlO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCJbXCI7XG4gICAgICAgICAgaWYgKGdsb2JbaSArIDFdID09PSBcIiFcIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIl5cIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09PSBcIl5cIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIlxcXFxeXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09PSBcIjpcIikge1xuICAgICAgICAgIGxldCBrID0gaSArIDE7XG4gICAgICAgICAgbGV0IHZhbHVlID0gXCJcIjtcbiAgICAgICAgICB3aGlsZSAoZ2xvYltrICsgMV0gIT09IHVuZGVmaW5lZCAmJiBnbG9iW2sgKyAxXSAhPT0gXCI6XCIpIHtcbiAgICAgICAgICAgIHZhbHVlICs9IGdsb2JbayArIDFdO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZ2xvYltrICsgMV0gPT09IFwiOlwiICYmIGdsb2JbayArIDJdID09PSBcIl1cIikge1xuICAgICAgICAgICAgaSA9IGsgKyAyO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBcImFsbnVtXCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiYWxwaGFcIikgc2VnbWVudCArPSBcIkEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiYXNjaWlcIikgc2VnbWVudCArPSBcIlxceDAwLVxceDdGXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJibGFua1wiKSBzZWdtZW50ICs9IFwiXFx0IFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiY250cmxcIikgc2VnbWVudCArPSBcIlxceDAwLVxceDFGXFx4N0ZcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09PSBcImRpZ2l0XCIpIHNlZ21lbnQgKz0gXCJcXFxcZFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwiZ3JhcGhcIikgc2VnbWVudCArPSBcIlxceDIxLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJsb3dlclwiKSBzZWdtZW50ICs9IFwiYS16XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJwcmludFwiKSBzZWdtZW50ICs9IFwiXFx4MjAtXFx4N0VcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09PSBcInB1bmN0XCIpIHtcbiAgICAgICAgICAgICAgc2VnbWVudCArPSBcIiFcXFwiIyQlJicoKSorLFxcXFwtLi86Ozw9Pj9AW1xcXFxcXFxcXFxcXF1eX+KAmHt8fX5cIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IFwic3BhY2VcIikgc2VnbWVudCArPSBcIlxcXFxzXFx2XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJ1cHBlclwiKSBzZWdtZW50ICs9IFwiQS1aXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gXCJ3b3JkXCIpIHNlZ21lbnQgKz0gXCJcXFxcd1wiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IFwieGRpZ2l0XCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtRmEtZlwiO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIl1cIiAmJiBpblJhbmdlKSB7XG4gICAgICAgIGluUmFuZ2UgPSBmYWxzZTtcbiAgICAgICAgc2VnbWVudCArPSBcIl1cIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChpblJhbmdlKSB7XG4gICAgICAgIGlmIChnbG9iW2ldID09PSBcIlxcXFxcIikge1xuICAgICAgICAgIHNlZ21lbnQgKz0gYFxcXFxcXFxcYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWdtZW50ICs9IGdsb2JbaV07XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PT0gXCIpXCIgJiYgZ3JvdXBTdGFjay5sZW5ndGggPiAwICYmXG4gICAgICAgIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSAhPT0gXCJCUkFDRVwiXG4gICAgICApIHtcbiAgICAgICAgc2VnbWVudCArPSBcIilcIjtcbiAgICAgICAgY29uc3QgdHlwZSA9IGdyb3VwU3RhY2sucG9wKCkhO1xuICAgICAgICBpZiAodHlwZSA9PT0gXCIhXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHdpbGRjYXJkO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgIT09IFwiQFwiKSB7XG4gICAgICAgICAgc2VnbWVudCArPSB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGdsb2JbaV0gPT09IFwifFwiICYmIGdyb3VwU3RhY2subGVuZ3RoID4gMCAmJlxuICAgICAgICBncm91cFN0YWNrW2dyb3VwU3RhY2subGVuZ3RoIC0gMV0gIT09IFwiQlJBQ0VcIlxuICAgICAgKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJ8XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PT0gXCIrXCIgJiYgZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiK1wiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT09IFwiQFwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09PSBcIihcIikge1xuICAgICAgICBpKys7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIkBcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIj9cIikge1xuICAgICAgICBpZiAoZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT09IFwiKFwiKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGdyb3VwU3RhY2sucHVzaChcIj9cIik7XG4gICAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIuXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIiFcIiAmJiBleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PT0gXCIoXCIpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBncm91cFN0YWNrLnB1c2goXCIhXCIpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKD8hXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQlJBQ0VcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09PSBcIn1cIiAmJiBncm91cFN0YWNrW2dyb3VwU3RhY2subGVuZ3RoIC0gMV0gPT09IFwiQlJBQ0VcIikge1xuICAgICAgICBncm91cFN0YWNrLnBvcCgpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKVwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT09IFwiLFwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PT0gXCJCUkFDRVwiKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJ8XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PT0gXCIqXCIpIHtcbiAgICAgICAgaWYgKGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09PSBcIihcIikge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBncm91cFN0YWNrLnB1c2goXCIqXCIpO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwcmV2Q2hhciA9IGdsb2JbaSAtIDFdO1xuICAgICAgICAgIGxldCBudW1TdGFycyA9IDE7XG4gICAgICAgICAgd2hpbGUgKGdsb2JbaSArIDFdID09PSBcIipcIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgbnVtU3RhcnMrKztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbmV4dENoYXIgPSBnbG9iW2kgKyAxXTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBnbG9ic3Rhck9wdGlvbiAmJiBudW1TdGFycyA9PT0gMiAmJlxuICAgICAgICAgICAgWy4uLnNlcHMsIHVuZGVmaW5lZF0uaW5jbHVkZXMocHJldkNoYXIpICYmXG4gICAgICAgICAgICBbLi4uc2VwcywgdW5kZWZpbmVkXS5pbmNsdWRlcyhuZXh0Q2hhcilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHNlZ21lbnQgKz0gZ2xvYnN0YXI7XG4gICAgICAgICAgICBlbmRzV2l0aFNlcCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlZ21lbnQgKz0gd2lsZGNhcmQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzZWdtZW50ICs9IHJlZ0V4cEVzY2FwZUNoYXJzLmluY2x1ZGVzKGdsb2JbaV0pID8gYFxcXFwke2dsb2JbaV19YCA6IGdsb2JbaV07XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHVuY2xvc2VkIGdyb3VwcyBvciBhIGRhbmdsaW5nIGJhY2tzbGFzaC5cbiAgICBpZiAoZ3JvdXBTdGFjay5sZW5ndGggPiAwIHx8IGluUmFuZ2UgfHwgaW5Fc2NhcGUpIHtcbiAgICAgIC8vIFBhcnNlIGZhaWx1cmUuIFRha2UgYWxsIGNoYXJhY3RlcnMgZnJvbSB0aGlzIHNlZ21lbnQgbGl0ZXJhbGx5LlxuICAgICAgc2VnbWVudCA9IFwiXCI7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgZ2xvYi5zbGljZShqLCBpKSkge1xuICAgICAgICBzZWdtZW50ICs9IHJlZ0V4cEVzY2FwZUNoYXJzLmluY2x1ZGVzKGMpID8gYFxcXFwke2N9YCA6IGM7XG4gICAgICAgIGVuZHNXaXRoU2VwID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVnRXhwU3RyaW5nICs9IHNlZ21lbnQ7XG4gICAgaWYgKCFlbmRzV2l0aFNlcCkge1xuICAgICAgcmVnRXhwU3RyaW5nICs9IGkgPCBnbG9iLmxlbmd0aCA/IHNlcCA6IHNlcE1heWJlO1xuICAgICAgZW5kc1dpdGhTZXAgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIFRlcm1pbmF0ZXMgd2l0aCBgaWAgYXQgdGhlIHN0YXJ0IG9mIHRoZSBuZXh0IHNlZ21lbnQuXG4gICAgd2hpbGUgKHNlcHMuaW5jbHVkZXMoZ2xvYltpXSkpIGkrKztcblxuICAgIC8vIENoZWNrIHRoYXQgdGhlIG5leHQgdmFsdWUgb2YgYGpgIGlzIGluZGVlZCBoaWdoZXIgdGhhbiB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICBpZiAoIShpID4gaikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFzc2VydGlvbiBmYWlsdXJlOiBpID4gaiAocG90ZW50aWFsIGluZmluaXRlIGxvb3ApXCIpO1xuICAgIH1cbiAgICBqID0gaTtcbiAgfVxuXG4gIHJlZ0V4cFN0cmluZyA9IGBeJHtyZWdFeHBTdHJpbmd9JGA7XG4gIHJldHVybiBuZXcgUmVnRXhwKHJlZ0V4cFN0cmluZywgY2FzZUluc2Vuc2l0aXZlID8gXCJpXCIgOiBcIlwiKTtcbn1cblxuLyoqIFRlc3Qgd2hldGhlciB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGEgZ2xvYiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzR2xvYihzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBjaGFyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgXCJ7XCI6IFwifVwiLCBcIihcIjogXCIpXCIsIFwiW1wiOiBcIl1cIiB9O1xuICBjb25zdCByZWdleCA9XG4gICAgL1xcXFwoLil8KF4hfFxcKnxcXD98W1xcXS4rKV1cXD98XFxbW15cXFxcXFxdXStcXF18XFx7W15cXFxcfV0rXFx9fFxcKFxcP1s6IT1dW15cXFxcKV0rXFwpfFxcKFtefF0rXFx8W15cXFxcKV0rXFwpKS87XG5cbiAgaWYgKHN0ciA9PT0gXCJcIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcblxuICB3aGlsZSAoKG1hdGNoID0gcmVnZXguZXhlYyhzdHIpKSkge1xuICAgIGlmIChtYXRjaFsyXSkgcmV0dXJuIHRydWU7XG4gICAgbGV0IGlkeCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuXG4gICAgLy8gaWYgYW4gb3BlbiBicmFja2V0L2JyYWNlL3BhcmVuIGlzIGVzY2FwZWQsXG4gICAgLy8gc2V0IHRoZSBpbmRleCB0byB0aGUgbmV4dCBjbG9zaW5nIGNoYXJhY3RlclxuICAgIGNvbnN0IG9wZW4gPSBtYXRjaFsxXTtcbiAgICBjb25zdCBjbG9zZSA9IG9wZW4gPyBjaGFyc1tvcGVuXSA6IG51bGw7XG4gICAgaWYgKG9wZW4gJiYgY2xvc2UpIHtcbiAgICAgIGNvbnN0IG4gPSBzdHIuaW5kZXhPZihjbG9zZSwgaWR4KTtcbiAgICAgIGlmIChuICE9PSAtMSkge1xuICAgICAgICBpZHggPSBuICsgMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdHIgPSBzdHIuc2xpY2UoaWR4KTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIExpa2Ugbm9ybWFsaXplKCksIGJ1dCBkb2Vzbid0IGNvbGxhcHNlIFwiKipcXC8uLlwiIHdoZW4gYGdsb2JzdGFyYCBpcyB0cnVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUdsb2IoXG4gIGdsb2I6IHN0cmluZyxcbiAgeyBnbG9ic3RhciA9IGZhbHNlIH06IEdsb2JPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICBpZiAoZ2xvYi5tYXRjaCgvXFwwL2cpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBHbG9iIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVyczogXCIke2dsb2J9XCJgKTtcbiAgfVxuICBpZiAoIWdsb2JzdGFyKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZShnbG9iKTtcbiAgfVxuICBjb25zdCBzID0gU0VQX1BBVFRFUk4uc291cmNlO1xuICBjb25zdCBiYWRQYXJlbnRQYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICBgKD88PSgke3N9fF4pXFxcXCpcXFxcKiR7c30pXFxcXC5cXFxcLig/PSR7c318JClgLFxuICAgIFwiZ1wiLFxuICApO1xuICByZXR1cm4gbm9ybWFsaXplKGdsb2IucmVwbGFjZShiYWRQYXJlbnRQYXR0ZXJuLCBcIlxcMFwiKSkucmVwbGFjZSgvXFwwL2csIFwiLi5cIik7XG59XG5cbi8qKiBMaWtlIGpvaW4oKSwgYnV0IGRvZXNuJ3QgY29sbGFwc2UgXCIqKlxcLy4uXCIgd2hlbiBgZ2xvYnN0YXJgIGlzIHRydWUuICovXG5leHBvcnQgZnVuY3Rpb24gam9pbkdsb2JzKFxuICBnbG9iczogc3RyaW5nW10sXG4gIHsgZXh0ZW5kZWQgPSB0cnVlLCBnbG9ic3RhciA9IGZhbHNlIH06IEdsb2JPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICBpZiAoIWdsb2JzdGFyIHx8IGdsb2JzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBqb2luKC4uLmdsb2JzKTtcbiAgfVxuICBpZiAoZ2xvYnMubGVuZ3RoID09PSAwKSByZXR1cm4gXCIuXCI7XG4gIGxldCBqb2luZWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBnbG9iIG9mIGdsb2JzKSB7XG4gICAgY29uc3QgcGF0aCA9IGdsb2I7XG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFqb2luZWQpIGpvaW5lZCA9IHBhdGg7XG4gICAgICBlbHNlIGpvaW5lZCArPSBgJHtTRVB9JHtwYXRofWA7XG4gICAgfVxuICB9XG4gIGlmICgham9pbmVkKSByZXR1cm4gXCIuXCI7XG4gIHJldHVybiBub3JtYWxpemVHbG9iKGpvaW5lZCwgeyBleHRlbmRlZCwgZ2xvYnN0YXIgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsRUFBZSxNQUFNLFFBQVEsV0FBVztBQUMxRCxTQUFTLEdBQUcsRUFBRSxXQUFXLFFBQVEsaUJBQWlCO0FBQ2xELFlBQVksWUFBWSxhQUFhO0FBQ3JDLFlBQVksWUFBWSxhQUFhO0FBRXJDLE1BQU0sT0FBTyxZQUFZLFNBQVM7QUFDbEMsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRztBQXdCNUIsTUFBTSxvQkFBb0I7RUFDeEI7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtDQUNEO0FBQ0QsTUFBTSxtQkFBbUI7RUFBQztFQUFLO0VBQU07Q0FBSTtBQUV6Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzREQXNENEQsR0FDNUQsT0FBTyxTQUFTLGFBQ2QsSUFBWSxFQUNaLEVBQ0UsV0FBVyxJQUFJLEVBQ2YsVUFBVSxpQkFBaUIsSUFBSSxFQUMvQixLQUFLLE1BQU0sRUFDWCxrQkFBa0IsS0FBSyxFQUNILEdBQUcsQ0FBQyxDQUFDO0VBRTNCLElBQUksU0FBUyxJQUFJO0lBQ2YsT0FBTztFQUNUO0VBRUEsTUFBTSxNQUFNLE9BQU8sWUFBWSxnQkFBZ0I7RUFDL0MsTUFBTSxXQUFXLE9BQU8sWUFBWSxnQkFBZ0I7RUFDcEQsTUFBTSxPQUFPLE9BQU8sWUFBWTtJQUFDO0lBQU07R0FBSSxHQUFHO0lBQUM7R0FBSTtFQUNuRCxNQUFNLFdBQVcsT0FBTyxZQUNwQixnQ0FDQTtFQUNKLE1BQU0sV0FBVyxPQUFPLFlBQVksY0FBYztFQUNs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