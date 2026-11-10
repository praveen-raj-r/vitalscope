"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
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

export interface TrendPoint {
  day: string; // YYYY-MM-DD (UTC)
  p75: number;
  samples: number;
}

const SERIES = "var(--color-vz-series)";
const SURFACE = "var(--color-vz-surface)";

interface TooltipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
  metric: MetricKey;
}

/** Value leads (strong), the date follows (secondary). A short line in the series colour keys the row. */
function TrendTooltip({ active, payload, metric }: TooltipProps) {
  const point = active ? (payload?.[0]?.payload as TrendPoint | undefined) : undefined; // recharts types payload as unknown
  if (!point) return null;
  return (
    <div className="rounded-md border border-vz-border bg-vz-surface px-3 py-2 text-sm shadow-sm">
      <div className="text-xs text-vz-ink-2">{formatDay(point.day)}</div>
      <div className="mt-1 flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-0.5 w-3" style={{ background: SERIES }} />
        <span className="font-semibold text-vz-ink">{formatValue(metric, point.p75)}</span>
        <span className="text-vz-ink-2">p75</span>
      </div>
      <div className="mt-0.5 text-xs text-vz-ink-2">
        n = {point.samples}
        {!hasEnoughData(point.samples) && ` (under ${MIN_SAMPLES}: low sample)`}
      </div>
    </div>
  );
}

export function TrendChart({ metric, points }: { metric: MetricKey; points: TrendPoint[] }) {
  const last = points[points.length - 1];
  return (
    // Height includes the x-axis band, so the card never gets a nested scrollbar.
    <div className="h-56 w-full" role="group" aria-label={`${METRIC_NAMES[metric]} p75 by day`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 20, right: 28, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-vz-grid)" strokeWidth={1} />
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tickLine={false}
            axisLine={{ stroke: "var(--color-vz-axis)" }}
            tick={{ fill: "var(--color-vz-muted)", fontSize: 12 }}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis
            domain={[0, "auto"]}
            tickFormatter={(v: number) => formatAxis(metric, v)}
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: "var(--color-vz-muted)", fontSize: 12 }}
          />
          {/* Solid hairline at the "good" limit. extendDomain stretches the axis up to it, so a tiny value is
              shown against the threshold instead of filling a rescaled axis, and the ticks stay round. */}
          <ReferenceLine
            y={THRESHOLDS[metric][0]}
            stroke="var(--color-vz-muted)"
            strokeWidth={1}
            ifOverflow="extendDomain"
            label={{
              value: `Good ≤ ${formatValue(metric, THRESHOLDS[metric][0])}`,
              position: "insideTopRight",
              fill: "var(--color-vz-muted)",
              fontSize: 11,
            }}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-vz-axis)", strokeWidth: 1 }}
            content={(props) => <TrendTooltip active={props.active} payload={props.payload} metric={metric} />}
          />
          <Area
            type="linear"
            dataKey="p75"
            stroke={SERIES}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={SERIES}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 5, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {last && (
            <ReferenceDot
              x={last.day}
              y={last.p75}
              r={5}
              fill={SERIES}
              stroke={SURFACE}
              strokeWidth={2}
              ifOverflow="visible"
              label={{ value: formatValue(metric, last.p75), position: "top", fill: "var(--color-vz-ink-2)", fontSize: 12 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
