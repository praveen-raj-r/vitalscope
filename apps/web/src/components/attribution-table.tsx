import type { AttributionRow } from "@/lib/stats";
import { formatValue, hasEnoughData, MIN_SAMPLES, percent, type MetricKey } from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

const TITLES: Record<MetricKey, { heading: string; target: string }> = {
  LCP: { heading: "Slowest LCP elements", target: "Element" },
  INP: { heading: "Slowest INP interactions", target: "Interaction target" },
  CLS: { heading: "Largest layout shifts", target: "Element that moved" },
};

export function AttributionTable({ metric, rows }: { metric: MetricKey; rows: AttributionRow[] }) {
  const { heading, target } = TITLES[metric];
  return (
    <section className="rounded-lg border border-vz-border bg-vz-surface p-5" aria-label={heading}>
      <h3 className="text-sm font-medium text-vz-ink">{heading}</h3>
      <p className="text-xs text-vz-ink-2">
        Ranked by how many samples were not &ldquo;good&rdquo;, so the biggest source of bad experiences comes first
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-vz-ink-2">
          No {metric} attribution recorded for this page and period. The browser only reports it when it can identify the
          element.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">{heading}</caption>
            <thead>
              <tr className="text-xs text-vz-ink-2">
                <th scope="col" className="py-1 pr-4 font-medium">
                  {target}
                </th>
                <th scope="col" className="py-1 pr-4 font-medium">
                  p75
                </th>
                <th scope="col" className="py-1 pr-4 font-medium">
                  Samples
                </th>
                <th scope="col" className="py-1 font-medium">
                  Not good
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => {
                const enough = hasEnoughData(r.samples);
                return (
                  <tr key={r.target} className="border-t border-vz-grid">
                    <th scope="row" className="max-w-xs truncate py-2 pr-4 font-mono text-xs font-normal text-vz-ink" title={r.target}>
                      {r.target}
                    </th>
                    <td className={`py-2 pr-4 ${enough ? "text-vz-ink" : "text-vz-muted"}`}>{formatValue(metric, r.p75)}</td>
                    <td className="py-2 pr-4">
                      {nf.format(r.samples)}
                      {!enough && <span className="ml-2 text-xs text-vz-muted">under {MIN_SAMPLES}</span>}
                    </td>
                    <td className="py-2">
                      {nf.format(r.not_good)} <span className="text-xs text-vz-ink-2">({percent(r.not_good, r.samples)}%)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
