import { HistogramChart } from "./histogram-chart";
import { RatingBadge, RatingShape } from "./rating";
import { buildHistogram } from "@/lib/histogram";
import type { HistogramRow } from "@/lib/stats";
import { formatValue, METRIC_NAMES, RATING_LABELS, THRESHOLDS, type MetricKey, type Rating } from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

export function HistogramCard({ metric, rows }: { metric: MetricKey; rows: HistogramRow[] }) {
  const bars = buildHistogram(metric, rows);
  const total = bars.reduce((sum, b) => sum + b.samples, 0);
  const [good, needsImprovement] = THRESHOLDS[metric];
  const legend: { rating: Rating; text: string }[] = [
    { rating: "good", text: `up to ${formatValue(metric, good)}` },
    { rating: "needs-improvement", text: `up to ${formatValue(metric, needsImprovement)}` },
    { rating: "poor", text: `above ${formatValue(metric, needsImprovement)}` },
  ];

  return (
    <section className="rounded-lg border border-vz-border bg-vz-surface p-5" aria-label={`${metric} distribution`}>
      <h3 className="text-sm font-medium text-vz-ink">
        {METRIC_NAMES[metric]} ({metric}) distribution
      </h3>
      <p className="text-xs text-vz-ink-2">How many page views fall into each value range</p>

      {total === 0 ? (
        <p className="mt-6 text-sm text-vz-ink-2">No data for this page and period.</p>
      ) : (
        <>
          {/* A legend is always present: the colours are status colours, so each is named with a shape and words. */}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-vz-ink-2">
            {legend.map((l) => (
              <li key={l.rating} className="inline-flex items-center gap-1.5">
                <RatingShape rating={l.rating} size={10} />
                {RATING_LABELS[l.rating]} ({l.text})
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <HistogramChart metric={metric} bars={bars} />
          </div>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-vz-ink-2 hover:text-vz-ink">View as table</summary>
            <table className="mt-2 w-full text-left">
              <caption className="sr-only">{metric} samples per value range</caption>
              <thead>
                <tr className="text-xs text-vz-ink-2">
                  <th scope="col" className="py-1 pr-4 font-medium">
                    Range
                  </th>
                  <th scope="col" className="py-1 pr-4 font-medium">
                    Samples
                  </th>
                  <th scope="col" className="py-1 font-medium">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {bars.map((b) => (
                  <tr key={b.range} className="border-t border-vz-grid">
                    <td className="py-1 pr-4">{b.range}</td>
                    <td className="py-1 pr-4">{nf.format(b.samples)}</td>
                    <td className="py-1">
                      <RatingBadge rating={b.rating} />
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
