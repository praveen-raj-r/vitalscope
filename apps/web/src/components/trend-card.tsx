"use client";

import { useState } from "react";
import { RatingShape } from "./rating";
import { TrendChart, type TrendPoint } from "./trend-chart";
import { CARD, FOCUS, MONO } from "@/lib/ui";
import {
  formatDay,
  formatValue,
  hasEnoughData,
  METRIC_NAMES,
  MIN_SAMPLES,
  THRESHOLDS,
  type MetricKey,
} from "@/lib/vitals";

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4.5 gap-y-1.5 text-xs text-vz-ink-2">
      {(["good", "needs-improvement", "poor"] as const).map((r) => (
        <span key={r} className="inline-flex items-center gap-1.5">
          <RatingShape rating={r} />
          {r === "good" ? "Good" : r === "poor" ? "Poor" : "Needs improvement"}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true">
          <line x1="0" x2="18" y1="2" y2="2" stroke="#898781" strokeDasharray="4 3" />
        </svg>
        Rating limits
      </span>
    </div>
  );
}

/**
 * p75 by day for one metric. `have` is set when the metric has too few samples overall to chart; the card then
 * says so instead of drawing a line from a handful of visits.
 */
export function TrendCard({
  metric,
  points,
  days,
  have,
}: {
  metric: MetricKey;
  points: TrendPoint[];
  days: number;
  have?: number;
}) {
  const [table, setTable] = useState(false);
  const [good, poor] = THRESHOLDS[metric];
  const insufficient = have !== undefined;

  return (
    <section className={`${CARD} p-4 md:p-6`} aria-label={`${metric} trend`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-[1_1_260px]">
          <h3 className="text-[15px] leading-[1.35] font-semibold">
            {METRIC_NAMES[metric]} ({metric}) p75 by day
          </h3>
          <p className="mt-1 text-[13px] leading-normal text-vz-ink-2">
            Last {days} days · lower is better · Good ≤ {formatValue(metric, good)} · Poor &gt;{" "}
            {formatValue(metric, poor)}
          </p>
        </div>
        {!insufficient && points.length > 0 && (
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
        <div className="mt-4 flex min-h-40 items-center justify-center rounded-[10px] border border-dashed border-[rgb(11_11_11/0.14)] bg-vz-page p-4 text-center text-sm text-vz-ink-2 md:min-h-50">
          Not enough data (need {MIN_SAMPLES}, have {have})
        </div>
      ) : points.length === 0 ? (
        <p className="mt-6 text-sm text-vz-ink-2">No data for this period.</p>
      ) : table ? (
        // Every value in the chart is also available here, without needing a tooltip.
        <table className="mt-3.5 w-full border-collapse text-left text-sm tabular-nums">
          <caption className="sr-only">
            {METRIC_NAMES[metric]}, daily values (UTC), last {days} days
          </caption>
          <thead>
            <tr className="text-xs text-vz-ink-2">
              {["Day", "p75", "Samples"].map((h) => (
                <th key={h} scope="col" className="border-b border-vz-axis py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.day}>
                <th scope="row" className="border-b border-vz-grid py-2.5 font-normal">
                  {formatDay(p.day)}
                </th>
                <td className="border-b border-vz-grid py-2.5">{formatValue(metric, p.p75)}</td>
                <td className="border-b border-vz-grid py-2.5">
                  {p.samples}
                  {!hasEnoughData(p.samples) && <span className="ml-2 text-vz-ink-2">low sample</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <div className={`${MONO} mt-3.5`}>
            <TrendChart metric={metric} points={points} />
          </div>
          <Legend />
        </>
      )}
    </section>
  );
}
