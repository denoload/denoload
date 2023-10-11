// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { posixRelative, windowsRelative } from "./_relative.ts";
/**
 * Return the relative path from `from` to `to` based on current working directory.
 *
 * An example in windws, for instance:
 *  from = 'C:\\orandea\\test\\aaa'
 *  to = 'C:\\orandea\\impl\\bbb'
 * The output of the function should be: '..\\..\\impl\\bbb'
 *
 * @param from path in current working directory
 * @param to path in current working directory
 */ export function relative(from, to) {
  return isWindows ? windowsRelative(from, to) : posixRelative(from, to);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvcmVsYXRpdmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBwb3NpeFJlbGF0aXZlLCB3aW5kb3dzUmVsYXRpdmUgfSBmcm9tIFwiLi9fcmVsYXRpdmUudHNcIjtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHJlbGF0aXZlIHBhdGggZnJvbSBgZnJvbWAgdG8gYHRvYCBiYXNlZCBvbiBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LlxuICpcbiAqIEFuIGV4YW1wbGUgaW4gd2luZHdzLCBmb3IgaW5zdGFuY2U6XG4gKiAgZnJvbSA9ICdDOlxcXFxvcmFuZGVhXFxcXHRlc3RcXFxcYWFhJ1xuICogIHRvID0gJ0M6XFxcXG9yYW5kZWFcXFxcaW1wbFxcXFxiYmInXG4gKiBUaGUgb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBzaG91bGQgYmU6ICcuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYidcbiAqXG4gKiBAcGFyYW0gZnJvbSBwYXRoIGluIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnlcbiAqIEBwYXJhbSB0byBwYXRoIGluIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpc1dpbmRvd3MgPyB3aW5kb3dzUmVsYXRpdmUoZnJvbSwgdG8pIDogcG9zaXhSZWxhdGl2ZShmcm9tLCB0byk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBQ3JDLFNBQVMsYUFBYSxFQUFFLGVBQWUsUUFBUSxpQkFBaUI7QUFFaEU7Ozs7Ozs7Ozs7Q0FVQyxHQUNELE9BQU8sU0FBUyxTQUFTLElBQVksRUFBRSxFQUFVO0VBQy9DLE9BQU8sWUFBWSxnQkFBZ0IsTUFBTSxNQUFNLGNBQWMsTUFBTTtBQUNyRSJ9