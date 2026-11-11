"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatAxis,
  formatDay,
  formatValue,
  hasEnoughData,
  METRIC_NAMES,
  MIN_SAMPLES,
  THRESHOLDS,
  type MetricKey,
} from "@/lib/vitals";
import { MONO } from "@/lib/ui";

export interface TrendPoint {
  day: string; // YYYY-MM-DD (UTC)
  p75: number;
  samples: number;
}

const SERIES = "var(--color-vz-series)";
const SURFACE = "var(--color-vz-surface)";

/** Gap between y-axis ticks, in the metric's own unit (milliseconds for LCP and INP). */
const TICK_STEP: Record<MetricKey, number> = { LCP: 1000, INP: 150, CLS: 0.1 };

/**
 * A y-axis that always shows the Good, Needs improvement and Poor bands: it reaches at least 20% past the "poor"
 * limit, grows if a value is higher, and ends on a round tick.
 */
function yAxis(metric: MetricKey, points: TrendPoint[]) {
  const [good, poor] = THRESHOLDS[metric];
  const step = TICK_STEP[metric];
  const top = Math.max(poor * 1.2, Math.max(...points.map((p) => p.p75)) * 1.05);
  const max = +(Math.ceil(top / step - 1e-9) * step).toFixed(4);
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(+t.toFixed(4));
  return { good, poor, max, ticks };
}

interface TooltipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
  metric: MetricKey;
}

/** Dark tooltip: the day first, then the value, then how many samples back it. */
function TrendTooltip({ active, payload, metric }: TooltipProps) {
  const point = active ? (payload?.[0]?.payload as TrendPoint | undefined) : undefined; // recharts types payload as unknown
  if (!point) return null;
  return (
    <div className="rounded-lg bg-vz-ink px-3 py-2 text-xs leading-normal whitespace-nowrap text-vz-surface shadow-[0_8px_20px_-8px_rgb(11_11_11/0.4)]">
      <div className="font-semibold">{formatDay(point.day)}</div>
      <div className={MONO}>p75 {formatValue(metric, point.p75)}</div>
      <div className={`${MONO} text-[#d9d7cd]`}>
        {point.samples} samples
        {!hasEnoughData(point.samples) && ` · low sample (under ${MIN_SAMPLES})`}
      </div>
    </div>
  );
}

export function TrendChart({ metric, points }: { metric: MetricKey; points: TrendPoint[] }) {
  const { good, poor, max, ticks } = yAxis(metric, points);
  return (
    // Height includes the x-axis band, so the card never gets a nested scrollbar.
    <div className="h-56 w-full md:h-62.5" role="group" aria-label={`${METRIC_NAMES[metric]} p75 by day`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 4, bottom: 0, left: 0 }}>
          {/* Rating bands sit behind everything else. */}
          <ReferenceArea y1={0} y2={good} fill="#0ca30c" fillOpacity={0.1} stroke="none" ifOverflow="hidden" />
          <ReferenceArea y1={good} y2={poor} fill="#fab219" fillOpacity={0.18} stroke="none" ifOverflow="hidden" />
          <ReferenceArea y1={poor} y2={max} fill="#d03b3b" fillOpacity={0.1} stroke="none" ifOverflow="hidden" />
          <CartesianGrid vertical={false} stroke="var(--color-vz-grid)" strokeWidth={1} />
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tickLine={false}
            axisLine={{ stroke: "var(--color-vz-axis)" }}
            tick={{ fill: "var(--color-vz-ink-2)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickMargin={8}
            minTickGap={16}
            padding={{ left: 14, right: 26 }}
          />
          <YAxis
            type="number"
            domain={[0, max]}
            ticks={ticks}
            tickFormatter={(v: number) => formatAxis(metric, v)}
            tickLine={false}
            axisLine={false}
            width={metric === "CLS" ? 36 : 64}
            tick={{ fill: "var(--color-vz-ink-2)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          />
          <ReferenceLine y={good} stroke="var(--color-vz-muted)" strokeWidth={1} strokeDasharray="4 3" />
          <ReferenceLine y={poor} stroke="var(--color-vz-muted)" strokeWidth={1} strokeDasharray="4 3" />
          <Tooltip
            cursor={{ stroke: "var(--color-vz-ink)", strokeOpacity: 0.25, strokeWidth: 1 }}
            content={(props) => <TrendTooltip active={props.active} payload={props.payload} metric={metric} />}
          />
          <Line
            type="linear"
            dataKey="p75"
            stroke={SERIES}
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={{ r: 3.5, fill: SERIES, stroke: SURFACE, strokeWidth: 1.75 }}
            activeDot={{ r: 5.5, fill: SERIES, stroke: SURFACE, strokeWidth: 1.75 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
