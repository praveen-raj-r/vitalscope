import { hasEnoughData } from "./vitals";

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Baseline (a) and comparison (b) release for the comparison page. `available` is newest first.
 * Anything in the URL that is not a known release is ignored; missing ones default to "latest" (b) and the
 * release before it (a), so the page is useful without any clicking.
 */
export function pickReleases(params: Params, available: readonly string[]): { a: string | null; b: string | null } {
  const known = (v: string | undefined) => (v !== undefined && available.includes(v) ? v : null);
  const b = known(first(params.b)) ?? available[0] ?? null;
  const a = known(first(params.a)) ?? available.find((r) => r !== b) ?? null;
  return { a, b };
}

/** Relative change from baseline to current, in percent. Null when the baseline is zero or missing. */
export function changePercent(baseline: number | null | undefined, current: number | null | undefined): number | null {
  if (baseline == null || current == null || !(baseline > 0)) return null;
  return ((current - baseline) / baseline) * 100;
}

export type Verdict = "better" | "worse" | "same";

/** All three metrics are "lower is better". Changes under 1% are treated as no change. */
export function verdictFor(change: number | null): Verdict | null {
  if (change === null) return null;
  if (Math.abs(change) < 1) return "same";
  return change < 0 ? "better" : "worse";
}

export function formatChange(change: number): string {
  if (Math.abs(change) < 0.05) return "0.0%";
  return `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}%`;
}

/** A change is only trustworthy when both sides have at least the minimum number of samples. */
export function isComparable(samplesA: number, samplesB: number): boolean {
  return hasEnoughData(samplesA) && hasEnoughData(samplesB);
}
