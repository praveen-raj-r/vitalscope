import { changePercent, isComparable, verdictFor, type Verdict } from "./compare";
import type { OverviewRow } from "./stats";
import { HEADLINE_METRICS, type MetricKey } from "./vitals";

/** How one metric moved between the baseline and the compared release, or why it can't be said. */
export type MetricChange =
  | { metric: MetricKey; kind: "none" }
  | { metric: MetricKey; kind: Verdict; delta: number; percent: number };

/** A piece of the summary sentence. `tone` picks the colour; the words and arrows carry the meaning. */
export interface SummaryPart {
  text: string;
  tone: "plain" | "worse" | "better" | "same";
}

export function changeFor(metric: MetricKey, a: OverviewRow | undefined, b: OverviewRow | undefined): MetricChange {
  if (!a || !b || !isComparable(a.samples, b.samples)) return { metric, kind: "none" };
  const percent = changePercent(a.p75, b.p75);
  const kind = verdictFor(percent);
  if (percent === null || kind === null) return { metric, kind: "none" };
  return { metric, kind, delta: b.p75 - a.p75, percent };
}

/** Absolute change in the metric's own unit: "+320 ms" for LCP and INP (stored in ms), "−0.02" for CLS. */
export function formatDelta(metric: MetricKey, delta: number): string {
  const sign = delta < 0 ? "−" : "+";
  const size = Math.abs(delta);
  // A tiny CLS change would round to 0.00, which reads as no change, so show a third decimal.
  if (metric === "CLS") return `${sign}${size.toFixed(size.toFixed(2) === "0.00" ? 3 : 2)}`;
  return `${sign}${Math.round(size)} ms`;
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** One sentence that says what changed, for example "1.5.0 is ↑ worse on LCP (+320 ms), ↓ better on INP (−17 ms)." */
export function summarize(baseline: string, compare: string, changes: readonly MetricChange[]): SummaryPart[] {
  const parts: SummaryPart[] = [{ text: `${compare} `, tone: "plain" }];
  const moved = changes.filter((c) => c.kind !== "none");
  const unknown = changes.filter((c) => c.kind === "none").map((c) => c.metric);

  if (moved.length === 0) {
    return [{ text: `${compare} and ${baseline} can’t be compared yet: not enough data for ${list(unknown)}.`, tone: "plain" }];
  }

  const same = moved.filter((c) => c.kind === "same");
  if (same.length === moved.length && unknown.length === 0) {
    return [
      ...parts,
      { text: "is ", tone: "plain" },
      { text: "about the same", tone: "same" },
      { text: ` as ${baseline} on ${list(same.map((c) => c.metric))}: no meaningful change.`, tone: "plain" },
    ];
  }

  parts.push({ text: "is ", tone: "plain" });
  const all: { word: string; tone: SummaryPart["tone"]; items: string[] }[] = [
    { word: "↑ worse", tone: "worse", items: moved.filter((c) => c.kind === "worse").map((c) => withDelta(c)) },
    { word: "↓ better", tone: "better", items: moved.filter((c) => c.kind === "better").map((c) => withDelta(c)) },
    { word: "about the same", tone: "same", items: same.map((c) => c.metric) },
  ];
  const clauses = all.filter((c) => c.items.length > 0);

  clauses.forEach((c, i) => {
    parts.push({ text: c.word, tone: c.tone }, { text: ` on ${list(c.items)}${i < clauses.length - 1 ? ", " : ""}`, tone: "plain" });
  });
  parts.push({ text: ".", tone: "plain" });
  if (unknown.length > 0) {
    parts.push({ text: ` ${list(unknown)} can’t be compared yet: not enough data.`, tone: "plain" });
  }
  return parts;
}

function withDelta(c: MetricChange): string {
  return c.kind === "none" || c.kind === "same" ? c.metric : `${c.metric} (${formatDelta(c.metric, c.delta)})`;
}

export function changesFor(rowsA: readonly OverviewRow[], rowsB: readonly OverviewRow[]): MetricChange[] {
  return HEADLINE_METRICS.map((m) =>
    changeFor(
      m,
      rowsA.find((r) => r.metric === m),
      rowsB.find((r) => r.metric === m),
    ),
  );
}
