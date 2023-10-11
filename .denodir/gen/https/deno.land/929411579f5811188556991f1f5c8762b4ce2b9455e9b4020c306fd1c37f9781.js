// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { posixIsAbsolute, windowsIsAbsolute } from "./_is_absolute.ts";
const WHITESPACE_ENCODINGS = {
  "\u0009": "%09",
  "\u000A": "%0A",
  "\u000B": "%0B",
  "\u000C": "%0C",
  "\u000D": "%0D",
  "\u0020": "%20"
};
function encodeWhitespace(string) {
  return string.replaceAll(/[\s]/g, (c)=>{
    return WHITESPACE_ENCODINGS[c] ?? c;
  });
}
/**
 * Converts a path string to a file URL.
 *
 * ```ts
 * import { toFileUrl } from "https://deno.land/std@$STD_VERSION/path/posix.ts";
 *
 * toFileUrl("/home/foo"); // new URL("file:///home/foo")
 * ```
 * @param path to convert to file URL
 */ export function posixToFileUrl(path) {
  if (!posixIsAbsolute(path)) {
    throw new TypeError("Must be an absolute path.");
  }
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
  return url;
}
/**
 * Converts a path string to a file URL.
 *
 * ```ts
 * import { toFileUrl } from "https://deno.land/std@$STD_VERSION/path/win32.ts";
 *
 * toFileUrl("\\home\\foo"); // new URL("file:///home/foo")
 * toFileUrl("C:\\Users\\foo"); // new URL("file:///C:/Users/foo")
 * toFileUrl("\\\\127.0.0.1\\home\\foo"); // new URL("file://127.0.0.1/home/foo")
 * ```
 * @param path to convert to file URL
 */ export function windowsToFileUrl(path) {
  if (!windowsIsAbsolute(path)) {
    throw new TypeError("Must be an absolute path.");
  }
  const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
  if (hostname !== undefined && hostname !== "localhost") {
    url.hostname = hostname;
    if (!url.hostname) {
      throw new TypeError("Invalid hostname.");
    }
  }
  return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvX3RvX2ZpbGVfdXJsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IHBvc2l4SXNBYnNvbHV0ZSwgd2luZG93c0lzQWJzb2x1dGUgfSBmcm9tIFwiLi9faXNfYWJzb2x1dGUudHNcIjtcblxuY29uc3QgV0hJVEVTUEFDRV9FTkNPRElOR1M6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwiXFx1MDAwOVwiOiBcIiUwOVwiLFxuICBcIlxcdTAwMEFcIjogXCIlMEFcIixcbiAgXCJcXHUwMDBCXCI6IFwiJTBCXCIsXG4gIFwiXFx1MDAwQ1wiOiBcIiUwQ1wiLFxuICBcIlxcdTAwMERcIjogXCIlMERcIixcbiAgXCJcXHUwMDIwXCI6IFwiJTIwXCIsXG59O1xuXG5mdW5jdGlvbiBlbmNvZGVXaGl0ZXNwYWNlKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlQWxsKC9bXFxzXS9nLCAoYykgPT4ge1xuICAgIHJldHVybiBXSElURVNQQUNFX0VOQ09ESU5HU1tjXSA/PyBjO1xuICB9KTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIHBhdGggc3RyaW5nIHRvIGEgZmlsZSBVUkwuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRvRmlsZVVybCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3BhdGgvcG9zaXgudHNcIjtcbiAqXG4gKiB0b0ZpbGVVcmwoXCIvaG9tZS9mb29cIik7IC8vIG5ldyBVUkwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpXG4gKiBgYGBcbiAqIEBwYXJhbSBwYXRoIHRvIGNvbnZlcnQgdG8gZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvc2l4VG9GaWxlVXJsKHBhdGg6IHN0cmluZykge1xuICBpZiAoIXBvc2l4SXNBYnNvbHV0ZShwYXRoKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJNdXN0IGJlIGFuIGFic29sdXRlIHBhdGguXCIpO1xuICB9XG5cbiAgY29uc3QgdXJsID0gbmV3IFVSTChcImZpbGU6Ly8vXCIpO1xuICB1cmwucGF0aG5hbWUgPSBlbmNvZGVXaGl0ZXNwYWNlKFxuICAgIHBhdGgucmVwbGFjZSgvJS9nLCBcIiUyNVwiKS5yZXBsYWNlKC9cXFxcL2csIFwiJTVDXCIpLFxuICApO1xuICByZXR1cm4gdXJsO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgcGF0aCBzdHJpbmcgdG8gYSBmaWxlIFVSTC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdG9GaWxlVXJsIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vcGF0aC93aW4zMi50c1wiO1xuICpcbiAqIHRvRmlsZVVybChcIlxcXFxob21lXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly8vaG9tZS9mb29cIilcbiAqIHRvRmlsZVVybChcIkM6XFxcXFVzZXJzXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly8vQzovVXNlcnMvZm9vXCIpXG4gKiB0b0ZpbGVVcmwoXCJcXFxcXFxcXDEyNy4wLjAuMVxcXFxob21lXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly8xMjcuMC4wLjEvaG9tZS9mb29cIilcbiAqIGBgYFxuICogQHBhcmFtIHBhdGggdG8gY29udmVydCB0byBmaWxlIFVSTFxuICovXG5leHBvcnQgZnVuY3Rpb24gd2luZG93c1RvRmlsZVVybChwYXRoOiBzdHJpbmcpOiBVUkwge1xuICBpZiAoIXdpbmRvd3NJc0Fic29sdXRlKHBhdGgpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk11c3QgYmUgYW4gYWJzb2x1dGUgcGF0aC5cIik7XG4gIH1cblxuICBjb25zdCBbLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gcGF0aC5tYXRjaChcbiAgICAvXig/OlsvXFxcXF17Mn0oW14vXFxcXF0rKSg/PVsvXFxcXF0oPzpbXi9cXFxcXXwkKSkpPyguKikvLFxuICApITtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChcImZpbGU6Ly8vXCIpO1xuICB1cmwucGF0aG5hbWUgPSBlbmNvZGVXaGl0ZXNwYWNlKHBhdGhuYW1lLnJlcGxhY2UoLyUvZywgXCIlMjVcIikpO1xuICBpZiAoaG9zdG5hbWUgIT09IHVuZGVmaW5lZCAmJiBob3N0bmFtZSAhPT0gXCJsb2NhbGhvc3RcIikge1xuICAgIHVybC5ob3N0bmFtZSA9IGhvc3RuYW1lO1xuICAgIGlmICghdXJsLmhvc3RuYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBob3N0bmFtZS5cIik7XG4gICAgfVxuICB9XG4gIHJldHVybiB1cmw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLGVBQWUsRUFBRSxpQkFBaUIsUUFBUSxvQkFBb0I7QUFFdkUsTUFBTSx1QkFBK0M7RUFDbkQsVUFBVTtFQUNWLFVBQVU7RUFDVixVQUFVO0VBQ1YsVUFBVTtFQUNWLFVBQVU7RUFDVixVQUFVO0FBQ1o7QUFFQSxTQUFTLGlCQUFpQixNQUFjO0VBQ3RDLE9BQU8sT0FBTyxVQUFVLENBQUMsU0FBUyxDQUFDO0lBQ2pDLE9BQU8sb0JBQW9CLENBQUMsRUFBRSxJQUFJO0VBQ3BDO0FBQ0Y7QUFFQTs7Ozs7Ozs7O0NBU0MsR0FDRCxPQUFPLFNBQVMsZUFBZSxJQUFZO0VBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsT0FBTztJQUMxQixNQUFNLElBQUksVUFBVTtFQUN0QjtFQUVBLE1BQU0sTUFBTSxJQUFJLElBQUk7RUFDcEIsSUFBSSxRQUFRLEdBQUcsaUJBQ2IsS0FBSyxPQUFPLENBQUMsTUFBTSxPQUFPLE9BQU8sQ0FBQyxPQUFPO0VBRTNDLE9BQU87QUFDVDtBQUVBOzs7Ozs7Ozs7OztDQVdDLEdBQ0QsT0FBTyxTQUFTLGlCQUFpQixJQUFZO0VBQzNDLElBQUksQ0FBQyxrQkFBa0IsT0FBTztJQUM1QixNQUFNLElBQUksVUFBVTtFQUN0QjtFQUVBLE1BQU0sR0FBRyxVQUFVLFNBQVMsR0FBRyxLQUFLLEtBQUssQ0FDdkM7RUFFRixNQUFNLE1BQU0sSUFBSSxJQUFJO0VBQ3BCLElBQUksUUFBUSxHQUFHLGlCQUFpQixTQUFTLE9BQU8sQ0FBQyxNQUFNO0VBQ3ZELElBQUksYUFBYSxhQUFhLGFBQWEsYUFBYTtJQUN0RCxJQUFJLFFBQVEsR0FBRztJQUNmLElBQUksQ0FBQyxJQUFJLFFBQVEsRUFBRTtNQUNqQixNQUFNLElBQUksVUFBVTtJQUN0QjtFQUNGO0VBQ0EsT0FBTztBQUNUIn0=