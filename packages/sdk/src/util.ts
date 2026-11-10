const MAX_STR = 200;

/** Trim a string to the spec's 200-char limit. */
export function clip(value: string): string {
  return value.length > MAX_STR ? value.slice(0, MAX_STR) : value;
}

/** Random id per page view. No cookies, no storage. */
export function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Remove query string and hash from a URL or path. */
export function stripQuery(url: string): string {
  return url.split(/[?#]/, 1)[0] ?? "";
}
