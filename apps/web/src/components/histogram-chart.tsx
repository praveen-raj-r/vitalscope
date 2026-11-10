"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RATING_COLORS, RatingBadge } from "./rating";
import type { HistogramBar } from "@/lib/histogram";
import { METRIC_NAMES, type MetricKey } from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

interface TooltipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
}

/** One tooltip per bar: the range, then the count (strong) and the rating as shape + words. */
function BarTooltip({ active, payload }: TooltipProps) {
  const bar = active ? (payload?.[0]?.payload as HistogramBar | undefined) : undefined; // recharts types payload as unknown
  if (!bar) return null;
  return (
    <div className="rounded-md border border-vz-border bg-vz-surface px-3 py-2 text-sm shadow-sm">
      <div className="text-xs text-vz-ink-2">{bar.range}</div>
      <div className="mt-1 font-semibold text-vz-ink">
        {nf.format(bar.samples)} {bar.samples === 1 ? "sample" : "samples"}
      </div>
      <div className="mt-0.5">
        <RatingBadge rating={bar.rating} />
      </div>
    </div>
  );
}

export function HistogramChart({ metric, bars }: { metric: MetricKey; bars: HistogramBar[] }) {
  return (
    // Height includes the x-axis band, so the card never gets a nested scrollbar.
    <div className="h-56 w-full" role="group" aria-label={`${METRIC_NAMES[metric]} distribution`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 16, right: 16, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--color-vz-grid)" strokeWidth={1} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--color-vz-axis)" }}
            tick={{ fill: "var(--color-vz-muted)", fontSize: 12 }}
            tickMargin={8}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: "var(--color-vz-muted)", fontSize: 12 }}
          />
          <Tooltip cursor={{ fill: "var(--color-vz-grid)", fillOpacity: 0.6 }} content={(p) => <BarTooltip active={p.active} payload={p.payload} />} />
          {/* Bars are capped at 24px and rounded at the top only; the spacing between them is the category gap. */}
          <Bar dataKey="samples" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
            {bars.map((b, i) => (
              <Cell key={i} fill={RATING_COLORS[b.rating]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
