import { RatingPill, RATING_COLORS } from "./rating";
import type { OverviewRow } from "@/lib/stats";
import { CARD, MONO, SERIF } from "@/lib/ui";
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
    <div role="img" aria-label={label} className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
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
    <article className={`${CARD} flex flex-col p-4 md:p-6`} aria-label={METRIC_NAMES[metric]}>
      <h3 className="text-sm font-normal text-vz-ink-2">
        {METRIC_NAMES[metric]} <span className={`${MONO} text-xs font-medium`}>({metric})</span>
      </h3>

      {row === undefined ? (
        <p className="mt-2.5 text-sm text-vz-ink-2">No data yet.</p>
      ) : (
        <>
          <p
            className={`${SERIF} mt-2.5 mb-3 text-[44px] leading-[1.05] tracking-[-0.02em] tabular-nums ${enough ? "text-vz-ink" : "text-vz-muted"}`}
          >
            {enough ? formatValue(metric, row.p75) : "—"}
          </p>
          <div className="flex min-h-7 items-center">
            {enough ? (
              <RatingPill rating={rate(metric, row.p75)} />
            ) : (
              <span className="text-sm text-vz-ink-2">
                Not enough data (need {MIN_SAMPLES}, have {samples})
              </span>
            )}
          </div>
          <p className={`${MONO} mt-3 mb-3.5 text-[13px] text-vz-ink-2`}>
            p75 · n = {nf.format(samples)} {samples === 1 ? "sample" : "samples"}
          </p>
          {enough && (
            <div className="mt-auto">
              <DistributionBar metric={metric} row={row} />
              <p className="mt-2 text-xs leading-normal text-vz-ink-2">
                {percent(row.good, samples)}% good · {percent(row.ni, samples)}% needs improvement ·{" "}
                {percent(row.poor, samples)}% poor
              </p>
            </div>
          )}
        </>
      )}
    </article>
  );
}
