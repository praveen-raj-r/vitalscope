import { formatAxis, rate, type MetricKey, type Rating } from "./vitals";

export interface BinSpec {
  lo: number;
  hi: number;
  buckets: number;
}

/**
 * Equal-width bins per metric (LCP/INP in ms). Widths divide the spec thresholds exactly
 * (LCP 500 ms for 2.5 s / 4 s, INP 100 ms for 200 / 500 ms, CLS 0.05 for 0.1 / 0.25),
 * so no bin straddles a good / needs-improvement / poor boundary.
 */
export const HISTOGRAM_BINS: Record<MetricKey, BinSpec> = {
  LCP: { lo: 0, hi: 6000, buckets: 12 },
  INP: { lo: 0, hi: 1000, buckets: 10 },
  CLS: { lo: 0, hi: 0.5, buckets: 10 },
};

export interface HistogramBar {
  /** Lower edge, formatted for the axis. */
  label: string;
  /** Readable range for tooltips and the table, e.g. "2.5 s to 3 s" or "6 s or more". */
  range: string;
  samples: number;
  rating: Rating;
}

/** The database returns only non-empty buckets (1..buckets, plus buckets + 1 for overflow); this fills in the zeros. */
export function buildHistogram(metric: MetricKey, rows: readonly { bucket: number; samples: number }[]): HistogramBar[] {
  const { lo, hi, buckets } = HISTOGRAM_BINS[metric];
  const width = (hi - lo) / buckets;
  const counts = new Map(rows.map((r) => [r.bucket, r.samples]));

  return Array.from({ length: buckets + 1 }, (_, i) => {
    const from = lo + i * width;
    const overflow = i === buckets;
    // The midpoint decides the rating, so a bin that ends exactly on a threshold stays on its own side.
    // The overflow bin's midpoint is above the upper bound, which is always "poor".
    const rating = rate(metric, from + width / 2);
    return {
      label: formatAxis(metric, from),
      range: overflow ? `${formatAxis(metric, from)} or more` : `${formatAxis(metric, from)} to ${formatAxis(metric, from + width)}`,
      samples: counts.get(i + 1) ?? 0,
      rating,
    };
  });
}
