import type { AttributionRow } from "@/lib/stats";
import { CARD, MONO } from "@/lib/ui";
import {
  formatValue,
  hasEnoughData,
  MIN_SAMPLES,
  percent,
  type MetricKey,
} from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

const TITLES: Record<
  MetricKey,
  { heading: string; sub: string; target: string }
> = {
  LCP: {
    heading: "LCP element",
    sub: "The elements that were the largest contentful paint, slowest first",
    target: "Element",
  },
  INP: {
    heading: "INP interaction target",
    sub: "The elements the slowest interactions started on",
    target: "Interaction target",
  },
  CLS: {
    heading: "CLS shifting element",
    sub: "The elements that moved the most",
    target: "Element that moved",
  },
};

/** Columns on wide screens; on narrow ones the target takes a full row and the numbers sit under it. */
const ROW =
  "grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_80px_90px_110px] md:gap-4";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mr-1.5 text-xs text-vz-ink-2 md:hidden">{children}</span>
  );
}

export function AttributionTable({
  metric,
  rows,
}: {
  metric: MetricKey;
  rows: AttributionRow[];
}) {
  const { heading, sub, target } = TITLES[metric];
  return (
    <section className={`${CARD} p-4 md:p-6`} aria-label={heading}>
      <h3 className="text-[15px] leading-[1.35] font-semibold">{heading}</h3>
      <p className="mt-1 text-[13px] leading-normal text-vz-ink-2">{sub}</p>

      {rows.length === 0 ? (
        <div className="mt-3.5 rounded-[10px] bg-vz-page px-4 py-4.5 text-sm leading-normal text-vz-ink-2">
          The browser did not report which element caused this.
        </div>
      ) : (
        <div role="table" aria-label={heading} className="mt-3">
          <div
            role="row"
            className={`${ROW} hidden border-b border-vz-axis py-2 text-xs font-medium text-vz-ink-2 md:grid`}
          >
            <div role="columnheader">{target}</div>
            <div role="columnheader">p75</div>
            <div role="columnheader">Samples</div>
            <div role="columnheader">Not good</div>
          </div>
          {rows.map((r) => {
            const enough = hasEnoughData(r.samples);
            return (
              <div
                key={r.target}
                role="row"
                className={`${ROW} items-start border-b border-vz-grid py-3.5`}
              >
                <div
                  role="cell"
                  title={r.target}
                  className={`${MONO} col-span-2 min-w-0 text-[13.5px] leading-normal wrap-anywhere md:col-span-1`}
                >
                  {r.target}
                </div>
                <div
                  role="cell"
                  className={`text-sm tabular-nums ${enough ? "" : "text-vz-ink-2"}`}
                >
                  <Label>p75</Label>
                  {formatValue(metric, r.p75)}
                </div>
                <div role="cell" className="text-sm tabular-nums">
                  <Label>Samples</Label>
                  {nf.format(r.samples)}
                  {!enough && (
                    <span className="ml-2 text-xs text-vz-ink-2">
                      under {MIN_SAMPLES}
                    </span>
                  )}
                </div>
                <div
                  role="cell"
                  className="col-span-2 text-sm tabular-nums md:col-span-1"
                >
                  <Label>Not good</Label>
                  {nf.format(r.not_good)}{" "}
                  <span className="text-xs text-vz-ink-2">
                    ({percent(r.not_good, r.samples)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
