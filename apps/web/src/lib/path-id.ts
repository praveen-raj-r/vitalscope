/**
 * Paths contain slashes and percent signs ("/blog/:id", "/caf%C3%A9"), which are awkward in a URL segment and
 * decoded inconsistently. The page detail route carries the path as base64url instead, which is always one safe segment.
 */
export function encodePathId(path: string): string {
  return Buffer.from(path, "utf8").toString("base64url");
}

/** Returns null for anything that is not exactly what encodePathId produces (so garbage URLs become a 404). */
export function decodePathId(id: string): string | null {
  const path = Buffer.from(id, "base64url").toString("utf8");
  if (path.length === 0 || path.length > 200) return null;
  return encodePathId(path) === id ? path : null;
}
