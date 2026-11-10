export type MetricKey = "LCP" | "INP" | "CLS";
export type Rating = "good" | "needs-improvement" | "poor";

export const HEADLINE_METRICS: readonly MetricKey[] = ["LCP", "INP", "CLS"];

/** Spec thresholds: [good up to, needs-improvement up to]. Above the second is poor. LCP/INP in ms. */
export const THRESHOLDS: Record<MetricKey, readonly [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
};

/** Below this many samples a number is shown greyed out as "not enough data". */
export const MIN_SAMPLES = 30;

export const METRIC_NAMES: Record<MetricKey, string> = {
  LCP: "Largest Contentful Paint",
  INP: "Interaction to Next Paint",
  CLS: "Cumulative Layout Shift",
};

export const RATING_LABELS: Record<Rating, string> = {
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
};

export function rate(metric: MetricKey, value: number): Rating {
  const [good, needsImprovement] = THRESHOLDS[metric];
  if (value <= good) return "good";
  if (value <= needsImprovement) return "needs-improvement";
  return "poor";
}

export function hasEnoughData(samples: number): boolean {
  return samples >= MIN_SAMPLES;
}

/** LCP in seconds, INP in ms, CLS unitless. */
export function formatValue(metric: MetricKey, value: number): string {
  if (metric === "LCP") return `${(value / 1000).toFixed(2)} s`;
  if (metric === "INP") return `${Math.round(value)} ms`;
  return value.toFixed(2);
}

/** Shorter form for chart axes. */
export function formatAxis(metric: MetricKey, value: number): string {
  if (metric === "LCP") return `${+(value / 1000).toFixed(2)} s`;
  if (metric === "INP") return `${Math.round(value)} ms`;
  return `${+value.toFixed(2)}`;
}

/** Whole-number share of `part` in `total`; 0 when there is no total. */
export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** "2026-11-10" -> "Nov 10". Fixed locale and time zone so server and browser render the same text. */
export function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
}
