"use client";

import { useState } from "react";
import { HistogramChart } from "./histogram-chart";
import { RatingGlyph, RatingShape } from "./rating";
import { buildHistogram, HISTOGRAM_BINS } from "@/lib/histogram";
import type { HistogramRow } from "@/lib/stats";
import { CARD, FOCUS } from "@/lib/ui";
import { formatValue, METRIC_NAMES, MIN_SAMPLES, RATING_LABELS, THRESHOLDS, type MetricKey } from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

/**
 * Distribution of one metric for one page. `p75` marks where the 75th percentile falls; `have` is set when the
 * page has too few samples of this metric to show a distribution.
 */
export function HistogramCard({
  metric,
  rows,
  p75,
  have,
}: {
  metric: MetricKey;
  rows: HistogramRow[];
  p75?: number;
  have?: number;
}) {
  const [table, setTable] = useState(false);
  const bars = buildHistogram(metric, rows);
  const total = bars.reduce((sum, b) => sum + b.samples, 0);
  const [good, poor] = THRESHOLDS[metric];
  const insufficient = have !== undefined;

  // The bar that holds the p75 (the last bar collects everything above the range).
  const { lo, hi, buckets } = HISTOGRAM_BINS[metric];
  const p75Index =
    p75 === undefined ? undefined : Math.min(buckets, Math.max(0, Math.floor(((p75 - lo) / (hi - lo)) * buckets)));
  const p75Bar = p75Index === undefined ? undefined : bars[p75Index]?.label;
  const shown = bars.filter((b) => b.samples > 0);

  return (
    <section className={`${CARD} p-4 md:p-6`} aria-label={`${metric} distribution`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-[1_1_260px]">
          <h3 className="text-[15px] leading-[1.35] font-semibold">
            {METRIC_NAMES[metric]} ({metric}) distribution
          </h3>
          <p className="mt-1 text-[13px] leading-normal text-vz-ink-2">How many page views fall into each value range</p>
        </div>
        {!insufficient && total > 0 && (
          <button
            type="button"
            aria-pressed={table}
            onClick={() => setTable((t) => !t)}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium shadow-[inset_0_0_0_1px_rgb(11_11_11/0.18)] hover:bg-[#efeee9] ${table ? "bg-[#efeee9]" : "bg-vz-surface"} ${FOCUS}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="1" y="2" width="12" height="10" rx="1.5" fill="none" stroke="#0b0b0b" strokeWidth="1.3" />
              <path d="M1 6h12M5.5 6v6" stroke="#0b0b0b" strokeWidth="1.3" />
            </svg>
            View as table
          </button>
        )}
      </div>

      {insufficient ? (
        <div className="mt-4 flex min-h-40 items-center justify-center rounded-[10px] bg-vz-page p-4 text-center text-sm text-vz-ink-2 md:min-h-55">
          Not enough data (need {MIN_SAMPLES}, have {have})
        </div>
      ) : total === 0 ? (
        <p className="mt-6 text-sm text-vz-ink-2">No data for this page and period.</p>
      ) : table ? (
        <>
          <table className="mt-3.5 w-full border-collapse text-left text-sm tabular-nums">
            <caption className="sr-only">{METRIC_NAMES[metric]}, buckets with at least one sample</caption>
            <thead>
              <tr className="text-xs text-vz-ink-2">
                {["Range", "Samples", "Rating"].map((h) => (
                  <th key={h} scope="col" className="border-b border-vz-axis py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.range}>
                  <th scope="row" className="border-b border-vz-grid py-2.5 font-normal">
                    {b.range}
                  </th>
                  <td className="border-b border-vz-grid py-2.5">{nf.format(b.samples)}</td>
                  <td className="border-b border-vz-grid py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[13px]">
                      <RatingGlyph rating={b.rating} size={12} />
                      {RATING_LABELS[b.rating]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2.5 text-xs text-vz-ink-2">Buckets with no samples are omitted.</p>
        </>
      ) : (
        <>
          <div className="mt-3.5">
            <HistogramChart
              metric={metric}
              bars={bars}
              p75Bar={p75Bar}
            />
          </div>
          {/* The colours are status colours, so each is named with a shape and words. */}
          <ul className="mt-3 flex flex-wrap gap-x-4.5 gap-y-1.5 text-xs text-vz-ink-2">
            <li className="inline-flex items-center gap-1.5">
              <RatingShape rating="good" />
              Good (up to {formatValue(metric, good)})
            </li>
            <li className="inline-flex items-center gap-1.5">
              <RatingShape rating="needs-improvement" />
              Needs improvement (up to {formatValue(metric, poor)})
            </li>
            <li className="inline-flex items-center gap-1.5">
              <RatingShape rating="poor" />
              Poor (above {formatValue(metric, poor)})
            </li>
            {p75 !== undefined && (
              <li className="inline-flex items-center gap-1.5 font-medium text-vz-ink">
                <svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true">
                  <line x1="0" x2="18" y1="2" y2="2" stroke="#0b0b0b" strokeWidth="2" strokeDasharray="5 3" />
                </svg>
                p75 {formatValue(metric, p75)}
              </li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
