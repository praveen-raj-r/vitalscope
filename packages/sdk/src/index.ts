import { start } from "./core";
import type { InitOptions } from "./types";

export type { InitOptions, MetricName, Rating, Device, Report } from "./types";

// The hosted ingest URL, used when `endpoint` is not given. Every published version carries it, so move to a
// custom domain before this package has many users.
const DEFAULT_ENDPOINT = "https://vitalscope-rum.vercel.app/api/ingest";

let started = false;

/** Start collecting Core Web Vitals. Safe to call more than once. Never throws. */
export function init(options: InitOptions): void {
  try {
    if (started || typeof window === "undefined") return;
    const endpoint = options?.endpoint || DEFAULT_ENDPOINT;
    if (!options?.siteKey || !endpoint) {
      if (options?.debug) console.warn("[vitalscope] siteKey and endpoint are required");
      return;
    }
    started = true;
    start(options, endpoint);
  } catch (e) {
    if (options?.debug) console.warn("[vitalscope]", e);
  }
}
