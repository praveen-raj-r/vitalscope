"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RATING_COLORS, RatingGlyph } from "./rating";
import type { HistogramBar } from "@/lib/histogram";
import { MONO } from "@/lib/ui";
import { METRIC_NAMES, RATING_LABELS, type MetricKey, type Rating } from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

const BAND_FILL: Record<Rating, string> = { good: "#0ca30c", "needs-improvement": "#fab219", poor: "#d03b3b" };
const BAND_OPACITY: Record<Rating, number> = { good: 0.08, "needs-improvement": 0.14, poor: 0.08 };

interface TooltipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
}

/** Dark tooltip, same as the trend chart: the range, then the count, then the rating in words. */
function BarTooltip({ active, payload }: TooltipProps) {
  const bar = active ? (payload?.[0]?.payload as HistogramBar | undefined) : undefined; // recharts types payload as unknown
  if (!bar) return null;
  return (
    <div className="rounded-lg bg-vz-ink px-3 py-2 text-xs leading-normal whitespace-nowrap text-vz-surface shadow-[0_8px_20px_-8px_rgb(11_11_11/0.4)]">
      <div className="font-semibold">{bar.range}</div>
      <div className={MONO}>
        {nf.format(bar.samples)} {bar.samples === 1 ? "sample" : "samples"}
      </div>
      <div className="flex items-center gap-1.5 text-[#d9d7cd]">
        <RatingGlyph rating={bar.rating} size={11} />
        {RATING_LABELS[bar.rating]}
      </div>
    </div>
  );
}

/** First and last bar label of each consecutive run of one rating, for the shaded regions behind the bars. */
function regions(bars: HistogramBar[]) {
  const out: { rating: Rating; from: string; to: string }[] = [];
  for (const b of bars) {
    const last = out[out.length - 1];
    if (last && last.rating === b.rating) last.to = b.label;
    else out.push({ rating: b.rating, from: b.label, to: b.label });
  }
  return out;
}

export function HistogramChart({
  metric,
  bars,
  p75Bar,
}: {
  metric: MetricKey;
  bars: HistogramBar[];
  /** Label of the bar that holds the p75, where the marker is drawn. */
  p75Bar?: string;
}) {
  return (
    // Height includes the x-axis band, so the card never gets a nested scrollbar.
    <div className="h-62.5 w-full md:h-75" role="group" aria-label={`${METRIC_NAMES[metric]} distribution`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="18%">
          {regions(bars).map((r) => (
            <ReferenceArea
              key={r.rating}
              x1={r.from}
              x2={r.to}
              fill={BAND_FILL[r.rating]}
              fillOpacity={BAND_OPACITY[r.rating]}
              stroke="none"
              ifOverflow="visible"
              label={{
                value: RATING_LABELS[r.rating],
                position: "insideTopLeft",
                fontSize: 11.5,
                fontWeight: 500,
                fill: "var(--color-vz-ink)",
                offset: 6,
                // Narrow bands cannot hold the words on a phone; the legend below names them there.
                className: "max-md:hidden",
              }}
            />
          ))}
          <CartesianGrid vertical={false} stroke="var(--color-vz-grid)" strokeWidth={1} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--color-vz-axis)" }}
            tick={{ fill: "var(--color-vz-ink-2)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={4}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={34}
            tick={{ fill: "var(--color-vz-ink-2)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-vz-ink)", fillOpacity: 0.06 }}
            content={(p) => <BarTooltip active={p.active} payload={p.payload} />}
          />
          <Bar dataKey="samples" radius={[2, 2, 0, 0]} maxBarSize={48} isAnimationActive={false}>
            {bars.map((b, i) => (
              <Cell key={i} fill={RATING_COLORS[b.rating]} />
            ))}
          </Bar>
          {p75Bar && (
            <ReferenceLine
              x={p75Bar}
              stroke="var(--color-vz-ink)"
              strokeWidth={2}
              strokeDasharray="5 3"
              ifOverflow="visible"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
