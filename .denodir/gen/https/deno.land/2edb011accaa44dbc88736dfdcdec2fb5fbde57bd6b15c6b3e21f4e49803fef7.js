// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { posixToFileUrl, windowsToFileUrl } from "./_to_file_url.ts";
/**
 * Converts a path string to a file URL.
 *
 * ```ts
 * import { toFileUrl } from "https://deno.land/std@$STD_VERSION/path/to_file_url.ts";
 *
 * // posix
 * toFileUrl("/home/foo"); // new URL("file:///home/foo")
 *
 * // win32
 * toFileUrl("\\home\\foo"); // new URL("file:///home/foo")
 * toFileUrl("C:\\Users\\foo"); // new URL("file:///C:/Users/foo")
 * toFileUrl("\\\\127.0.0.1\\home\\foo"); // new URL("file://127.0.0.1/home/foo")
 * ```
 * @param path to convert to file URL
 */ export function toFileUrl(path) {
  return isWindows ? windowsToFileUrl(path) : posixToFileUrl(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvdG9fZmlsZV91cmwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBwb3NpeFRvRmlsZVVybCwgd2luZG93c1RvRmlsZVVybCB9IGZyb20gXCIuL190b19maWxlX3VybC50c1wiO1xuXG4vKipcbiAqIENvbnZlcnRzIGEgcGF0aCBzdHJpbmcgdG8gYSBmaWxlIFVSTC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdG9GaWxlVXJsIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vcGF0aC90b19maWxlX3VybC50c1wiO1xuICpcbiAqIC8vIHBvc2l4XG4gKiB0b0ZpbGVVcmwoXCIvaG9tZS9mb29cIik7IC8vIG5ldyBVUkwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpXG4gKlxuICogLy8gd2luMzJcbiAqIHRvRmlsZVVybChcIlxcXFxob21lXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly8vaG9tZS9mb29cIilcbiAqIHRvRmlsZVVybChcIkM6XFxcXFVzZXJzXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly8vQzovVXNlcnMvZm9vXCIpXG4gKiB0b0ZpbGVVcmwoXCJcXFxcXFxcXDEyNy4wLjAuMVxcXFxob21lXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly8xMjcuMC4wLjEvaG9tZS9mb29cIilcbiAqIGBgYFxuICogQHBhcmFtIHBhdGggdG8gY29udmVydCB0byBmaWxlIFVSTFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9GaWxlVXJsKHBhdGg6IHN0cmluZyk6IFVSTCB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzVG9GaWxlVXJsKHBhdGgpIDogcG9zaXhUb0ZpbGVVcmwocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsY0FBYyxFQUFFLGdCQUFnQixRQUFRLG9CQUFvQjtBQUVyRTs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsVUFBVSxJQUFZO0VBQ3BDLE9BQU8sWUFBWSxpQkFBaUIsUUFBUSxlQUFlO0FBQzdEIn0=