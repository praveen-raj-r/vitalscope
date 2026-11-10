/**
 * sendBeacon first (survives page unload); fetch with keepalive as the fallback.
 * The body is a string, so the content type is text/plain and no CORS preflight is needed.
 * Returns whether a send was attempted. Never throws.
 */
export function send(endpoint: string, body: string): boolean {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(endpoint, body)) return true;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    if (typeof fetch === "function") {
      void fetch(endpoint, { method: "POST", body, keepalive: true, mode: "cors" }).catch(() => {});
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
