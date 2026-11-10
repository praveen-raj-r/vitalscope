import { clip, stripQuery } from "./util";

/** Path only (no query/hash), after the optional routePattern. A throwing routePattern is ignored. */
export function normalizePath(rawPath: string, routePattern?: (path: string) => string): string {
  let path = stripQuery(rawPath) || "/";
  if (routePattern) {
    try {
      const out = routePattern(path);
      if (typeof out === "string" && out) path = stripQuery(out);
    } catch {
      /* keep the raw path */
    }
  }
  return clip(path);
}
