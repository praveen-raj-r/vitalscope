export type MetricName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
export type Rating = "good" | "needs-improvement" | "poor";
export type Device = "mobile" | "tablet" | "desktop";

export interface InitOptions {
  /** Public site key from the dashboard. Required. */
  siteKey: string;
  /** Ingest URL. Defaults to the hosted endpoint. */
  endpoint?: string;
  /** 0..1, decided once per page view. Default 1. */
  sampleRate?: number;
  /** Build/version tag. */
  release?: string;
  /** Normalise a path, e.g. /b/123 -> /b/:id. */
  routePattern?: (path: string) => string;
  /** Log problems to the console. Default false. */
  debug?: boolean;
}

export interface Report {
  metric: MetricName;
  value: number;
  rating: Rating;
  attribution?: Record<string, string>;
  path: string;
  device: Device;
  connection?: string;
  release?: string;
  pageViewId: string;
  ts: number;
}
