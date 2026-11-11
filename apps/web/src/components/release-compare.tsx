import { RatingGlyph } from "./rating";
import {
  changesFor,
  formatDelta,
  summarize,
  type MetricChange,
  type SummaryPart,
} from "@/lib/release-summary";
import { formatChange } from "@/lib/compare";
import type { OverviewRow } from "@/lib/stats";
import { CARD, MONO, SERIF } from "@/lib/ui";
import {
  formatAxis,
  formatValue,
  hasEnoughData,
  HEADLINE_METRICS,
  METRIC_NAMES,
  MIN_SAMPLES,
  RATING_LABELS,
  rate,
  THRESHOLDS,
  type MetricKey,
} from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

/** Where the range bar ends, in the metric's own unit. Values past it sit at the right edge. */
const BAR_MAX: Record<MetricKey, number> = { LCP: 5000, INP: 600, CLS: 0.3 };

const TONE: Record<SummaryPart["tone"], string> = {
  plain: "",
  worse: "font-medium text-vz-delta-bad",
  better: "font-medium text-vz-delta-good",
  same: "font-medium text-vz-ink-2",
};

const ARROW = {
  worse: "M7 1.5L12 7H8.2v5.5H5.8V7H2z",
  better: "M7 12.5L12 7H8.2V1.5H5.8V7H2z",
  same: "M2 4.8h10v1.9H2zM2 8h10v1.9H2z",
} as const;

const CHANGE_COLOR = {
  worse: "var(--color-vz-delta-bad)",
  better: "var(--color-vz-delta-good)",
  same: "var(--color-vz-ink-2)",
} as const;

function Side({
  label,
  release,
  metric,
  row,
}: {
  label: string;
  release: string;
  metric: MetricKey;
  row: OverviewRow | undefined;
}) {
  const enough = row !== undefined && hasEnoughData(row.samples);
  return (
    <div>
      <div className="mb-1.5 text-xs text-vz-ink-2">
        {label} · <span className={`${MONO} text-vz-ink`}>{release}</span>
      </div>
      {row && enough ? (
        <>
          <div
            className={`${SERIF} text-[34px] leading-[1.1] tracking-[-0.02em] tabular-nums`}
          >
            {formatValue(metric, row.p75)}
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-vz-page py-0.75 pr-2.5 pl-2 text-xs font-medium shadow-[inset_0_0_0_1px_rgb(11_11_11/0.14)]">
            <RatingGlyph rating={rate(metric, row.p75)} size={12} />
            {RATING_LABELS[rate(metric, row.p75)]}
          </span>
        </>
      ) : (
        <>
          <div className={`${SERIF} text-[34px] leading-[1.1] text-vz-muted`}>
            —
          </div>
          <div className="mt-2 text-[13px] leading-snug text-vz-ink-2">
            Not enough data (need {MIN_SAMPLES}, have {row?.samples ?? 0})
          </div>
        </>
      )}
      <div className={`${MONO} mt-2 text-xs text-vz-ink-2`}>
        n = {nf.format(row?.samples ?? 0)} samples
      </div>
    </div>
  );
}

function Change({ change }: { change: MetricChange }) {
  if (change.kind === "none") {
    return (
      <>
        <div className={`${SERIF} text-[34px] leading-[1.1] text-vz-muted`}>
          —
        </div>
        <div className="mt-2 text-sm text-vz-ink-2">
          Not enough data to compare
        </div>
      </>
    );
  }
  const color = CHANGE_COLOR[change.kind];
  const word = change.kind === "same" ? "about the same" : change.kind;
  return (
    <>
      <div className="flex items-center gap-2" style={{ color }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 14 14"
          aria-hidden="true"
          className="flex-none"
        >
          <path d={ARROW[change.kind]} fill={color} />
        </svg>
        <span
          className={`${SERIF} text-[34px] leading-[1.1] tracking-[-0.02em] tabular-nums`}
        >
          {formatDelta(change.metric, change.delta)}
        </span>
      </div>
      <div className="mt-2 text-sm tabular-nums" style={{ color }}>
        <span className="font-semibold">{word}</span> ·{" "}
        {formatChange(change.percent)}
      </div>
    </>
  );
}

/** The two p75 values on one horizontal Good / Needs improvement / Poor scale. */
function RangeBar({
  metric,
  baseline,
  compare,
  a,
  b,
}: {
  metric: MetricKey;
  baseline: number;
  compare: number;
  a: string;
  b: string;
}) {
  const max = BAR_MAX[metric];
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));
  const [good, poor] = THRESHOLDS[metric];
  const anchor = (p: number) =>
    p > 80 ? "-translate-x-full" : p < 20 ? "" : "-translate-x-1/2";
  const x1 = pct(baseline);
  const x2 = pct(compare);

  return (
    <div
      role="img"
      aria-label={`${METRIC_NAMES[metric]}: ${a} at ${formatValue(metric, baseline)}, ${b} at ${formatValue(metric, compare)}`}
      className="relative mt-4.5 h-23 border-t border-vz-grid pt-1.5"
    >
      {/* Rating bands, then dashed limit ticks with their values underneath. */}
      <div className="absolute top-9.5 right-2.5 left-2.5 h-3">
        <div
          className="absolute inset-y-0 left-0 bg-[rgb(12_163_12/0.16)]"
          style={{ width: `${pct(good)}%` }}
        />
        <div
          className="absolute inset-y-0 bg-[rgb(250_178_25/0.26)]"
          style={{ left: `${pct(good)}%`, width: `${pct(poor) - pct(good)}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-[rgb(208_59_59/0.16)]"
          style={{ left: `${pct(poor)}%` }}
        />
        {[good, poor].map((v) => (
          <div
            key={v}
            className="absolute -top-1 -bottom-1"
            style={{ left: `${pct(v)}%` }}
          >
            <div className="h-full border-l border-dashed border-vz-muted" />
            <span
              className={`${MONO} absolute top-[calc(100%+22px)] -translate-x-1/2 text-[10.5px] whitespace-nowrap text-vz-ink-2`}
            >
              {formatAxis(metric, v)}
            </span>
          </div>
        ))}
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-vz-ink-2"
          style={{
            left: `${Math.min(x1, x2)}%`,
            width: `${Math.abs(x2 - x1)}%`,
          }}
        />
        <div
          className="absolute top-1/2 size-3.25 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.25px] border-vz-ink-2 bg-vz-surface"
          style={{ left: `${x1}%` }}
        />
        <div
          className="absolute top-1/2 size-3.25 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-vz-surface bg-vz-series"
          style={{ left: `${x2}%` }}
        />
        <span
          className={`${MONO} absolute -top-6 text-[11.5px] whitespace-nowrap ${anchor(x1)}`}
          style={{ left: `${x1}%` }}
        >
          {a} · {formatValue(metric, baseline)}
        </span>
        <span
          className={`${MONO} absolute top-[calc(100%+6px)] text-[11.5px] font-semibold whitespace-nowrap ${anchor(x2)}`}
          style={{ left: `${x2}%` }}
        >
          {b} · {formatValue(metric, compare)}
        </span>
      </div>
    </div>
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
  const changes = changesFor(rowsA, rowsB);
  const summary = summarize(a, b, changes);

  return (
    <>
      <section
        className={`${CARD} px-4 py-4 md:px-7 md:py-6`}
        aria-live="polite"
      >
        <div
          className={`${MONO} mb-2 text-xs font-medium tracking-[0.06em] text-vz-ink-2 uppercase`}
        >
          Summary
        </div>
        <p
          className={`${SERIF} text-[22px] leading-[1.35] tracking-[-0.01em] text-pretty md:text-[28px]`}
        >
          {summary.map((p, i) => (
            <span key={i} className={TONE[p.tone]}>
              {p.text}
            </span>
          ))}
        </p>
      </section>

      <p className="my-4 text-sm leading-[1.55] text-pretty text-vz-ink-2">
        Change is the new p75 against the baseline p75. Lower is better for all
        three metrics, and a change is only shown when both releases have at
        least {MIN_SAMPLES} samples. The time range applies to both releases.
      </p>

      <div className="flex flex-col gap-4">
        {HEADLINE_METRICS.map((m, i) => {
          const ra = rowsA.find((r) => r.metric === m);
          const rb = rowsB.find((r) => r.metric === m);
          const change = changes[i]!;
          const [good, poor] = THRESHOLDS[m];
          return (
            <section
              key={m}
              className={`${CARD} p-4 md:p-6`}
              aria-label={`${m} release comparison`}
            >
              <h3 className="text-[15px] leading-[1.35] font-semibold">
                {METRIC_NAMES[m]}{" "}
                <span className={`${MONO} text-xs font-medium text-vz-ink-2`}>
                  ({m})
                </span>
              </h3>
              <p className="mt-1 mb-4 text-[13px] text-vz-ink-2">
                Good ≤ {formatValue(m, good)} · Poor &gt; {formatValue(m, poor)}
              </p>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-3">
                <Side label="Baseline" release={a} metric={m} row={ra} />
                <Side label="Compare" release={b} metric={m} row={rb} />
                <div className="col-span-2 border-t border-vz-grid pt-3.5 md:col-span-1 md:border-t-0 md:border-l md:pt-0 md:pl-5">
                  <div className="mb-1.5 text-xs text-vz-ink-2">Change</div>
                  <Change change={change} />
                </div>
              </div>
              {change.kind !== "none" && ra && rb && (
                <RangeBar
                  metric={m}
                  baseline={ra.p75}
                  compare={rb.p75}
                  a={a}
                  b={b}
                />
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
