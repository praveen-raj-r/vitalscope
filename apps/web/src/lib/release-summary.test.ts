import { describe, expect, it } from "vitest";
import { changesFor, formatDelta, summarize } from "./release-summary";
import type { OverviewRow } from "./stats";

const row = (metric: string, p75: number, samples = 100): OverviewRow => ({ metric, p75, samples, good: 0, ni: 0, poor: 0 });
const text = (a: string, b: string, A: OverviewRow[], B: OverviewRow[]) =>
  summarize(a, b, changesFor(A, B))
    .map((p) => p.text)
    .join("");

describe("release summary", () => {
  it("formats the absolute change in the metric's own unit", () => {
    expect(formatDelta("LCP", 320)).toBe("+320 ms");
    expect(formatDelta("INP", -17.4)).toBe("−17 ms");
    expect(formatDelta("CLS", -0.02)).toBe("−0.02");
  });

  it("names what got worse and what got better", () => {
    const A = [row("LCP", 2530), row("INP", 231), row("CLS", 0.09)];
    const B = [row("LCP", 2850), row("INP", 214), row("CLS", 0.07)];
    expect(text("1.4.0", "1.5.0", A, B)).toBe("1.5.0 is ↑ worse on LCP (+320 ms), ↓ better on INP (−17 ms) and CLS (−0.02).");
  });

  it("says about the same when nothing moved", () => {
    const A = [row("LCP", 2530), row("INP", 231), row("CLS", 0.09)];
    const B = [row("LCP", 2550), row("INP", 229), row("CLS", 0.09)];
    expect(text("1.4.0", "1.5.0", A, B)).toBe("1.5.0 is about the same as 1.4.0 on LCP, INP and CLS: no meaningful change.");
  });

  it("says which metric lacks data instead of guessing", () => {
    const A = [row("LCP", 2530), row("INP", 231), row("CLS", 0.09, 6)];
    const B = [row("LCP", 2850), row("INP", 214), row("CLS", 0.07)];
    expect(text("1.4.0", "1.5.0", A, B)).toBe(
      "1.5.0 is ↑ worse on LCP (+320 ms), ↓ better on INP (−17 ms). CLS can’t be compared yet: not enough data.",
    );
  });

  it("copes with nothing comparable at all", () => {
    expect(text("1.4.0", "1.5.0", [], [])).toBe("1.5.0 and 1.4.0 can’t be compared yet: not enough data for LCP, INP and CLS.");
  });
});
