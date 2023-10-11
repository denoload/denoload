// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "../assert/assert.ts";
import { assertPath, isPathSeparator } from "./_util.ts";
import { posixNormalize, windowsNormalize } from "./_normalize.ts";
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */ export function posixJoin(...paths) {
  if (paths.length === 0) return ".";
  let joined;
  for(let i = 0, len = paths.length; i < len; ++i){
    const path = paths[i];
    assertPath(path);
    if (path.length > 0) {
      if (!joined) joined = path;
      else joined += `/${path}`;
    }
  }
  if (!joined) return ".";
  return posixNormalize(joined);
}
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */ export function windowsJoin(...paths) {
  if (paths.length === 0) return ".";
  let joined;
  let firstPart = null;
  for(let i = 0; i < paths.length; ++i){
    const path = paths[i];
    assertPath(path);
    if (path.length > 0) {
      if (joined === undefined) joined = firstPart = path;
      else joined += `\\${path}`;
    }
  }
  if (joined === undefined) return ".";
  // Make sure that the joined path doesn't start with two slashes, because
  // normalize() will mistake it for an UNC path then.
  //
  // This step is skipped when it is very clear that the user actually
  // intended to point at an UNC path. This is assumed when the first
  // non-empty string arguments starts with exactly two slashes followed by
  // at least one more non-slash character.
  //
  // Note that for normalize() to treat a path as an UNC path it needs to
  // have at least 2 components, so we don't filter for that here.
  // This means that the user can use join to construct UNC paths from
  // a server name and a share name; for example:
  //   path.join('//server', 'share') -> '\\\\server\\share\\')
  let needsReplace = true;
  let slashCount = 0;
  assert(firstPart !== null);
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    const firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
          else {
            // We matched a UNC path in the first part
            needsReplace = false;
          }
        }
      }
    }
  }
  if (needsReplace) {
    // Find any more consecutive slashes we need to replace
    for(; slashCount < joined.length; ++slashCount){
      if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
    }
    // Replace the slashes if needed
    if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
  }
  return windowsNormalize(joined);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3BhdGgvX2pvaW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL2Fzc2VydC9hc3NlcnQudHNcIjtcbmltcG9ydCB7IGFzc2VydFBhdGgsIGlzUGF0aFNlcGFyYXRvciB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5pbXBvcnQgeyBwb3NpeE5vcm1hbGl6ZSwgd2luZG93c05vcm1hbGl6ZSB9IGZyb20gXCIuL19ub3JtYWxpemUudHNcIjtcblxuLyoqXG4gKiBKb2luIGFsbCBnaXZlbiBhIHNlcXVlbmNlIG9mIGBwYXRoc2AsdGhlbiBub3JtYWxpemVzIHRoZSByZXN1bHRpbmcgcGF0aC5cbiAqIEBwYXJhbSBwYXRocyB0byBiZSBqb2luZWQgYW5kIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvc2l4Sm9pbiguLi5wYXRoczogc3RyaW5nW10pOiBzdHJpbmcge1xuICBpZiAocGF0aHMubGVuZ3RoID09PSAwKSByZXR1cm4gXCIuXCI7XG5cbiAgbGV0IGpvaW5lZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGF0aHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBjb25zdCBwYXRoID0gcGF0aHNbaV07XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgICBpZiAocGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoIWpvaW5lZCkgam9pbmVkID0gcGF0aDtcbiAgICAgIGVsc2Ugam9pbmVkICs9IGAvJHtwYXRofWA7XG4gICAgfVxuICB9XG4gIGlmICgham9pbmVkKSByZXR1cm4gXCIuXCI7XG4gIHJldHVybiBwb3NpeE5vcm1hbGl6ZShqb2luZWQpO1xufVxuXG4vKipcbiAqIEpvaW4gYWxsIGdpdmVuIGEgc2VxdWVuY2Ugb2YgYHBhdGhzYCx0aGVuIG5vcm1hbGl6ZXMgdGhlIHJlc3VsdGluZyBwYXRoLlxuICogQHBhcmFtIHBhdGhzIHRvIGJlIGpvaW5lZCBhbmQgbm9ybWFsaXplZFxuICovXG5leHBvcnQgZnVuY3Rpb24gd2luZG93c0pvaW4oLi4ucGF0aHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgaWYgKHBhdGhzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuXG4gIGxldCBqb2luZWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGZpcnN0UGFydDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyArK2kpIHtcbiAgICBjb25zdCBwYXRoID0gcGF0aHNbaV07XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgICBpZiAocGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoam9pbmVkID09PSB1bmRlZmluZWQpIGpvaW5lZCA9IGZpcnN0UGFydCA9IHBhdGg7XG4gICAgICBlbHNlIGpvaW5lZCArPSBgXFxcXCR7cGF0aH1gO1xuICAgIH1cbiAgfVxuXG4gIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFwiLlwiO1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBqb2luZWQgcGF0aCBkb2Vzbid0IHN0YXJ0IHdpdGggdHdvIHNsYXNoZXMsIGJlY2F1c2VcbiAgLy8gbm9ybWFsaXplKCkgd2lsbCBtaXN0YWtlIGl0IGZvciBhbiBVTkMgcGF0aCB0aGVuLlxuICAvL1xuICAvLyBUaGlzIHN0ZXAgaXMgc2tpcHBlZCB3aGVuIGl0IGlzIHZlcnkgY2xlYXIgdGhhdCB0aGUgdXNlciBhY3R1YWxseVxuICAvLyBpbnRlbmRlZCB0byBwb2ludCBhdCBhbiBVTkMgcGF0aC4gVGhpcyBpcyBhc3N1bWVkIHdoZW4gdGhlIGZpcnN0XG4gIC8vIG5vbi1lbXB0eSBzdHJpbmcgYXJndW1lbnRzIHN0YXJ0cyB3aXRoIGV4YWN0bHkgdHdvIHNsYXNoZXMgZm9sbG93ZWQgYnlcbiAgLy8gYXQgbGVhc3Qgb25lIG1vcmUgbm9uLXNsYXNoIGNoYXJhY3Rlci5cbiAgLy9cbiAgLy8gTm90ZSB0aGF0IGZvciBub3JtYWxpemUoKSB0byB0cmVhdCBhIHBhdGggYXMgYW4gVU5DIHBhdGggaXQgbmVlZHMgdG9cbiAgLy8gaGF2ZSBhdCBsZWFzdCAyIGNvbXBvbmVudHMsIHNvIHdlIGRvbid0IGZpbHRlciBmb3IgdGhhdCBoZXJlLlxuICAvLyBUaGlzIG1lYW5zIHRoYXQgdGhlIHVzZXIgY2FuIHVzZSBqb2luIHRvIGNvbnN0cnVjdCBVTkMgcGF0aHMgZnJvbVxuICAvLyBhIHNlcnZlciBuYW1lIGFuZCBhIHNoYXJlIG5hbWU7IGZvciBleGFtcGxlOlxuICAvLyAgIHBhdGguam9pbignLy9zZXJ2ZXInLCAnc2hhcmUnKSAtPiAnXFxcXFxcXFxzZXJ2ZXJcXFxcc2hhcmVcXFxcJylcbiAgbGV0IG5lZWRzUmVwbGFjZSA9IHRydWU7XG4gIGxldCBzbGFzaENvdW50ID0gMDtcbiAgYXNzZXJ0KGZpcnN0UGFydCAhPT0gbnVsbCk7XG4gIGlmIChpc1BhdGhTZXBhcmF0b3IoZmlyc3RQYXJ0LmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgKytzbGFzaENvdW50O1xuICAgIGNvbnN0IGZpcnN0TGVuID0gZmlyc3RQYXJ0Lmxlbmd0aDtcbiAgICBpZiAoZmlyc3RMZW4gPiAxKSB7XG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICArK3NsYXNoQ291bnQ7XG4gICAgICAgIGlmIChmaXJzdExlbiA+IDIpIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDIpKSkgKytzbGFzaENvdW50O1xuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyBwYXRoIGluIHRoZSBmaXJzdCBwYXJ0XG4gICAgICAgICAgICBuZWVkc1JlcGxhY2UgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKG5lZWRzUmVwbGFjZSkge1xuICAgIC8vIEZpbmQgYW55IG1vcmUgY29uc2VjdXRpdmUgc2xhc2hlcyB3ZSBuZWVkIHRvIHJlcGxhY2VcbiAgICBmb3IgKDsgc2xhc2hDb3VudCA8IGpvaW5lZC5sZW5ndGg7ICsrc2xhc2hDb3VudCkge1xuICAgICAgaWYgKCFpc1BhdGhTZXBhcmF0b3Ioam9pbmVkLmNoYXJDb2RlQXQoc2xhc2hDb3VudCkpKSBicmVhaztcbiAgICB9XG5cbiAgICAvLyBSZXBsYWNlIHRoZSBzbGFzaGVzIGlmIG5lZWRlZFxuICAgIGlmIChzbGFzaENvdW50ID49IDIpIGpvaW5lZCA9IGBcXFxcJHtqb2luZWQuc2xpY2Uoc2xhc2hDb3VudCl9YDtcbiAgfVxuXG4gIHJldHVybiB3aW5kb3dzTm9ybWFsaXplKGpvaW5lZCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLE1BQU0sUUFBUSxzQkFBc0I7QUFDN0MsU0FBUyxVQUFVLEVBQUUsZUFBZSxRQUFRLGFBQWE7QUFDekQsU0FBUyxjQUFjLEVBQUUsZ0JBQWdCLFFBQVEsa0JBQWtCO0FBRW5FOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxVQUFVLEdBQUcsS0FBZTtFQUMxQyxJQUFJLE1BQU0sTUFBTSxLQUFLLEdBQUcsT0FBTztFQUUvQixJQUFJO0VBQ0osSUFBSyxJQUFJLElBQUksR0FBRyxNQUFNLE1BQU0sTUFBTSxFQUFFLElBQUksS0FBSyxFQUFFLEVBQUc7SUFDaEQsTUFBTSxPQUFPLEtBQUssQ0FBQyxFQUFFO0lBQ3JCLFdBQVc7SUFDWCxJQUFJLEtBQUssTUFBTSxHQUFHLEdBQUc7TUFDbkIsSUFBSSxDQUFDLFFBQVEsU0FBUztXQUNqQixVQUFVLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQztJQUMzQjtFQUNGO0VBQ0EsSUFBSSxDQUFDLFFBQVEsT0FBTztFQUNwQixPQUFPLGVBQWU7QUFDeEI7QUFFQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsWUFBWSxHQUFHLEtBQWU7RUFDNUMsSUFBSSxNQUFNLE1BQU0sS0FBSyxHQUFHLE9BQU87RUFFL0IsSUFBSTtFQUNKLElBQUksWUFBMkI7RUFDL0IsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLE1BQU0sTUFBTSxFQUFFLEVBQUUsRUFBRztJQUNyQyxNQUFNLE9BQU8sS0FBSyxDQUFDLEVBQUU7SUFDckIsV0FBVztJQUNYLElBQUksS0FBSyxNQUFNLEdBQUcsR0FBRztNQUNuQixJQUFJLFdBQVcsV0FBVyxTQUFTLFlBQVk7V0FDMUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUM7SUFDNUI7RUFDRjtFQUVBLElBQUksV0FBVyxXQUFXLE9BQU87RUFFakMseUVBQXlFO0VBQ3pFLG9EQUFvRDtFQUNwRCxFQUFFO0VBQ0Ysb0VBQW9FO0VBQ3BFLG1FQUFtRTtFQUNuRSx5RUFBeUU7RUFDekUseUNBQXlDO0VBQ3pDLEVBQUU7RUFDRix1RUFBdUU7RUFDdkUsZ0VBQWdFO0VBQ2hFLG9FQUFvRTtFQUNwRSwrQ0FBK0M7RUFDL0MsNkRBQTZEO0VBQzdELElBQUksZUFBZTtFQUNuQixJQUFJLGFBQWE7RUFDakIsT0FBTyxjQUFjO0VBQ3JCLElBQUksZ0JBQWdCLFVBQVUsVUFBVSxDQUFDLEtBQUs7SUFDNUMsRUFBRTtJQUNGLE1BQU0sV0FBVyxVQUFVLE1BQU07SUFDakMsSUFBSSxXQUFXLEdBQUc7TUFDaEIsSUFBSSxnQkFBZ0IsVUFBVSxVQUFVLENBQUMsS0FBSztRQUM1QyxFQUFFO1FBQ0YsSUFBSSxXQUFXLEdBQUc7VUFDaEIsSUFBSSxnQkFBZ0IsVUFBVSxVQUFVLENBQUMsS0FBSyxFQUFFO2VBQzNDO1lBQ0gsMENBQTBDO1lBQzFDLGVBQWU7VUFDakI7UUFDRjtNQUNGO0lBQ0Y7RUFDRjtFQUNBLElBQUksY0FBYztJQUNoQix1REFBdUQ7SUFDdkQsTUFBTyxhQUFhLE9BQU8sTUFBTSxFQUFFLEVBQUUsV0FBWTtNQUMvQyxJQUFJLENBQUMsZ0JBQWdCLE9BQU8sVUFBVSxDQUFDLGNBQWM7SUFDdkQ7SUFFQSxnQ0FBZ0M7SUFDaEMsSUFBSSxjQUFjLEdBQUcsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUM7RUFDL0Q7RUFFQSxPQUFPLGlCQUFpQjtBQUMxQiJ9