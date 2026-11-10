import { TrendChart, type TrendPoint } from "./trend-chart";
import { formatDay, formatValue, hasEnoughData, METRIC_NAMES, THRESHOLDS, type MetricKey } from "@/lib/vitals";

export function TrendCard({ metric, points, days }: { metric: MetricKey; points: TrendPoint[]; days: number }) {
  return (
    <section className="rounded-lg border border-vz-border bg-vz-surface p-5" aria-label={`${metric} trend`}>
      <h3 className="text-sm font-medium text-vz-ink">
        {METRIC_NAMES[metric]} ({metric}) p75 by day
      </h3>
      <p className="text-xs text-vz-ink-2">
        Last {days} days · lower is better · the grey line marks the &ldquo;good&rdquo; limit (up to{" "}
        {formatValue(metric, THRESHOLDS[metric][0])})
      </p>

      {points.length === 0 ? (
        <p className="mt-6 text-sm text-vz-ink-2">No data for this period.</p>
      ) : (
        <>
          <div className="mt-3">
            <TrendChart metric={metric} points={points} />
          </div>
          {/* Every value in the chart is also available here, without needing a tooltip. */}
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-vz-ink-2 hover:text-vz-ink">View as table</summary>
            <table className="mt-2 w-full text-left">
              <caption className="sr-only">
                {metric} p75 by day (UTC), last {days} days
              </caption>
              <thead>
                <tr className="text-xs text-vz-ink-2">
                  <th scope="col" className="py-1 pr-4 font-medium">
                    Day
                  </th>
                  <th scope="col" className="py-1 pr-4 font-medium">
                    p75
                  </th>
                  <th scope="col" className="py-1 font-medium">
                    Samples
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {points.map((p) => (
                  <tr key={p.day} className="border-t border-vz-grid">
                    <td className="py-1 pr-4">{formatDay(p.day)}</td>
                    <td className="py-1 pr-4">{formatValue(metric, p.p75)}</td>
                    <td className="py-1">
                      {p.samples}
                      {!hasEnoughData(p.samples) && <span className="ml-2 text-vz-muted">low sample</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
