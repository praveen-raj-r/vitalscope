import { RatingShape } from "./rating";
import { changePercent, formatChange, isComparable, verdictFor } from "@/lib/compare";
import type { OverviewRow } from "@/lib/stats";
import {
  formatValue,
  hasEnoughData,
  HEADLINE_METRICS,
  METRIC_NAMES,
  MIN_SAMPLES,
  rate,
  type MetricKey,
} from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

function Side({ metric, row }: { metric: MetricKey; row: OverviewRow | undefined }) {
  if (!row) return <span className="text-vz-muted">no data</span>;
  const enough = hasEnoughData(row.samples);
  return (
    <span className="inline-flex items-center gap-1.5">
      {enough && <RatingShape rating={rate(metric, row.p75)} size={10} />}
      <span className={enough ? "text-vz-ink" : "text-vz-muted"}>{formatValue(metric, row.p75)}</span>
      <span className="text-xs text-vz-muted">
        n={nf.format(row.samples)}
        {!enough && ` · under ${MIN_SAMPLES}`}
      </span>
    </span>
  );
}

function Change({ metric, a, b }: { metric: MetricKey; a: OverviewRow | undefined; b: OverviewRow | undefined }) {
  if (!a || !b) return <span className="text-vz-muted">no comparison</span>;
  if (!isComparable(a.samples, b.samples)) {
    return <span className="text-vz-muted">Not enough data (need {MIN_SAMPLES} on both sides)</span>;
  }
  const change = changePercent(a.p75, b.p75);
  const verdict = verdictFor(change);
  if (change === null || verdict === null) return <span className="text-vz-muted">no comparison</span>;
  if (verdict === "same") return <span className="text-vz-ink">No change ({formatChange(change)})</span>;

  const better = verdict === "better";
  // An arrow and a word carry the meaning; the colour only reinforces it. For all three metrics lower is better.
  return (
    <span
      className="font-medium"
      style={{ color: better ? "var(--color-vz-delta-good)" : "var(--color-vz-delta-bad)" }}
      aria-label={`${METRIC_NAMES[metric]} is ${better ? "better" : "worse"} by ${formatChange(Math.abs(change)).replace("+", "")}`}
    >
      <span aria-hidden="true">{better ? "▼" : "▲"}</span> {formatChange(change)} {better ? "better" : "worse"}
    </span>
  );
}

export function ReleaseCompare({
  a,
  b,
  rowsA,
  rowsB,
}: {
  a: string;
  b: string;
  rowsA: OverviewRow[];
  rowsB: OverviewRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-vz-border bg-vz-surface">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <caption className="sr-only">
          p75 of each metric for release {a} (baseline) and release {b}, with the change between them
        </caption>
        <thead>
          <tr className="border-b border-vz-grid text-xs text-vz-ink-2">
            <th scope="col" className="px-4 py-3 font-medium">
              Metric
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Baseline <span className="font-mono text-vz-ink">{a}</span>
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Compare <span className="font-mono text-vz-ink">{b}</span>
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {HEADLINE_METRICS.map((m) => {
            const ra = rowsA.find((r) => r.metric === m);
            const rb = rowsB.find((r) => r.metric === m);
            return (
              <tr key={m} className="border-t border-vz-grid">
                <th scope="row" className="px-4 py-3 font-normal text-vz-ink">
                  {METRIC_NAMES[m]} <span className="text-vz-muted">({m})</span>
                </th>
                <td className="px-4 py-3">
                  <Side metric={m} row={ra} />
                </td>
                <td className="px-4 py-3">
                  <Side metric={m} row={rb} />
                </td>
                <td className="px-4 py-3">
                  <Change metric={m} a={ra} b={rb} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
