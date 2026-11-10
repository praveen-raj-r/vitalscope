import { RatingBadge, RATING_COLORS } from "./rating";
import type { OverviewRow } from "@/lib/stats";
import {
  formatValue,
  hasEnoughData,
  METRIC_NAMES,
  MIN_SAMPLES,
  percent,
  rate,
  type MetricKey,
  type Rating,
} from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

/** Thin segmented bar: widths are proportional, a 2px surface gap separates parts, a zero part draws nothing. */
function DistributionBar({ metric, row }: { metric: MetricKey; row: OverviewRow }) {
  const parts: { rating: Rating; count: number }[] = [
    { rating: "good", count: row.good },
    { rating: "needs-improvement", count: row.ni },
    { rating: "poor", count: row.poor },
  ];
  const label = `${METRIC_NAMES[metric]}: ${percent(row.good, row.samples)}% good, ${percent(row.ni, row.samples)}% needs improvement, ${percent(row.poor, row.samples)}% poor`;
  return (
    <div role="img" aria-label={label} className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
      {parts
        .filter((p) => p.count > 0)
        .map((p) => (
          <div key={p.rating} style={{ flex: p.count, background: RATING_COLORS[p.rating] }} />
        ))}
    </div>
  );
}

export function StatTile({ metric, row }: { metric: MetricKey; row: OverviewRow | undefined }) {
  const samples = row?.samples ?? 0;
  const enough = row !== undefined && hasEnoughData(samples);

  return (
    <article className="rounded-lg border border-vz-border bg-vz-surface p-5" aria-label={METRIC_NAMES[metric]}>
      <h3 className="text-sm text-vz-ink-2">
        {METRIC_NAMES[metric]} <span className="text-vz-muted">({metric})</span>
      </h3>

      {row === undefined ? (
        <p className="mt-2 text-sm text-vz-ink-2">No data yet.</p>
      ) : (
        <>
          <p className={`mt-2 text-4xl font-semibold ${enough ? "text-vz-ink" : "text-vz-muted"}`}>
            {formatValue(metric, row.p75)}
          </p>
          <div className="mt-2 min-h-6">
            {enough ? (
              <RatingBadge rating={rate(metric, row.p75)} />
            ) : (
              <span className="text-sm text-vz-ink-2">
                Not enough data (need {MIN_SAMPLES}, have {samples})
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-vz-ink-2">
            p75 · n = {nf.format(samples)} {samples === 1 ? "sample" : "samples"}
          </p>
          {enough && (
            <>
              <DistributionBar metric={metric} row={row} />
              <p className="mt-2 text-xs text-vz-ink-2">
                {percent(row.good, samples)}% good · {percent(row.ni, samples)}% needs improvement ·{" "}
                {percent(row.poor, samples)}% poor
              </p>
            </>
          )}
        </>
      )}
    </article>
  );
}
