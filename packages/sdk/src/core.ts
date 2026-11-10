import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";
import { pickAttribution } from "./attribution";
import { detectDevice } from "./device";
import { normalizePath } from "./path";
import { ReportQueue } from "./queue";
import { isSampled } from "./sampling";
import { send } from "./transport";
import type { InitOptions, Report } from "./types";
import { randomId } from "./util";

interface NavigatorExtras {
  userAgentData?: { mobile?: boolean };
  connection?: { effectiveType?: string };
}

/** Start collecting. Returns a stop function (used by tests). Throws only on programmer error; init() catches. */
export function start(options: InitOptions, endpoint: string): () => void {
  if (!isSampled(options.sampleRate)) return () => {};

  const pageViewId = randomId();
  const queue = new ReportQueue();

  const onMetric = (metric: Metric) => {
    try {
      const nav = navigator as Navigator & NavigatorExtras;
      const report: Report = {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        attribution: pickAttribution(metric),
        path: normalizePath(location.pathname, options.routePattern),
        device: detectDevice(window.innerWidth, nav.userAgentData?.mobile),
        connection: nav.connection?.effectiveType,
        release: options.release,
        pageViewId,
        ts: Date.now(),
      };
      queue.add(report);
    } catch (e) {
      if (options.debug) console.warn("[vitalscope]", e);
    }
  };

  const flush = () => {
    try {
      const body = queue.flush(options.siteKey);
      if (body) send(endpoint, body);
    } catch (e) {
      if (options.debug) console.warn("[vitalscope]", e);
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };

  // web-vitals registers its own visibilitychange listeners inside these calls. Ours are added
  // afterwards so that final values are queued before we flush.
  onLCP(onMetric);
  onINP(onMetric);
  onCLS(onMetric);
  onFCP(onMetric);
  onTTFB(onMetric);
  document.addEventListener("visibilitychange", onVisibility);
  addEventListener("pagehide", flush);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    removeEventListener("pagehide", flush);
  };
}
