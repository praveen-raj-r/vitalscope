import Link from "next/link";
import { MobileSort } from "./mobile-sort";
import { RatingGlyph } from "./rating";
import { filtersToParams, type Filters } from "@/lib/filters";
import {
  nextDir,
  type PageRow,
  type SortDir,
  type SortKey,
} from "@/lib/pages-table";
import { encodePathId } from "@/lib/path-id";
import { FOCUS, MONO } from "@/lib/ui";
import {
  formatValue,
  hasEnoughData,
  MIN_SAMPLES,
  RATING_LABELS,
  rate,
  type MetricKey,
} from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

/** One metric's p75 with its rating (shape, text) and sample count, or why there is no number. */
function Cell({
  metric,
  p75,
  n,
  align,
}: {
  metric: MetricKey;
  p75: number | null;
  n: number;
  align: "left" | "right";
}) {
  if (p75 === null || n === 0)
    return (
      <div className="text-[13px] leading-snug text-vz-ink-2">No data</div>
    );
  if (!hasEnoughData(n)) {
    return (
      <div className="max-w-45 text-[13px] leading-snug text-vz-ink-2">
        Not enough data (need {MIN_SAMPLES}, have {n})
      </div>
    );
  }
  const rating = rate(metric, p75);
  return (
    <>
      <div className="text-[15px] font-medium tabular-nums">
        {formatValue(metric, p75)}
      </div>
      <div
        className={`mt-1 flex flex-wrap items-center gap-2 ${align === "right" ? "justify-end" : ""}`}
      >
        <span className="inline-flex items-center gap-1.25 text-xs font-medium">
          <RatingGlyph rating={rating} size={12} />
          {RATING_LABELS[rating]}
        </span>
        <span className={`${MONO} text-xs text-vz-ink-2`}>n={n}</span>
      </div>
    </>
  );
}

const COLUMNS: { key: SortKey; label: string; width: string; pad: string }[] = [
  { key: "path", label: "Path", width: "34%", pad: "px-5" },
  { key: "views", label: "Views", width: "14%", pad: "px-4" },
  { key: "lcp", label: "LCP p75", width: "18%", pad: "px-4" },
  { key: "inp", label: "INP p75", width: "18%", pad: "px-4" },
  { key: "cls", label: "CLS p75", width: "16%", pad: "px-4" },
];

const METRICS = [
  { key: "lcp", metric: "LCP", n: "lcp_n", p: "lcp_p75" },
  { key: "inp", metric: "INP", n: "inp_n", p: "inp_p75" },
  { key: "cls", metric: "CLS", n: "cls_n", p: "cls_p75" },
] as const;

/**
 * A table on wide screens and stacked cards on narrow ones (both are in the page; CSS picks one). Column headers
 * are links, so sorting works with the keyboard and without client JavaScript.
 */
export function PagesTable({
  basePath,
  rows,
  sort,
  filters,
}: {
  basePath: string;
  rows: PageRow[];
  sort: { key: SortKey; dir: SortDir };
  filters: Filters;
}) {
  const sortHref = (key: SortKey, dir: SortDir) => {
    const params = filtersToParams(filters);
    params.set("sort", key);
    params.set("dir", dir);
    return `${basePath}/pages?${params.toString()}`;
  };
  const pathHref = (path: string) =>
    `${basePath}/pages/${encodePathId(path)}?${filtersToParams(filters).toString()}`;
  const flipped: SortDir = sort.dir === "asc" ? "desc" : "asc";

  return (
    <>
      <MobileSort
        current={sort.key}
        dir={sort.dir}
        flipHref={sortHref(sort.key, flipped)}
        options={COLUMNS.map((c) => ({
          key: c.key,
          label: c.label,
          href: sortHref(c.key, sort.dir),
        }))}
      />

      <div className="hidden overflow-hidden rounded-[14px] bg-vz-surface shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)] md:block">
        <table className="w-full border-collapse text-left tabular-nums">
          <caption className="sr-only">
            Pages with views and p75 per metric. Sorted by {sort.key},{" "}
            {sort.dir === "asc" ? "ascending" : "descending"}.
          </caption>
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const on = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={
                      on
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    style={{ width: c.width }}
                    className="border-b border-vz-axis bg-vz-page p-0 text-left"
                  >
                    <Link
                      href={sortHref(c.key, nextDir(sort, c.key))}
                      className={`flex min-h-12 items-center gap-1.5 text-[13px] font-medium text-vz-ink no-underline hover:bg-[#efeee9] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-vz-series ${c.pad}`}
                    >
                      {c.label}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        aria-hidden="true"
                        style={{ opacity: on ? 1 : 0.35 }}
                      >
                        <path
                          d={
                            on
                              ? sort.dir === "desc"
                                ? "M5 9L1 2h8z"
                                : "M5 1l4 7H1z"
                              : "M5 1l3 3.5H2zM5 9L2 5.5h6z"
                          }
                          fill="#0b0b0b"
                        />
                      </svg>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path}>
                <th
                  scope="row"
                  className="border-b border-vz-grid px-5 py-3.5 text-left align-top font-normal"
                >
                  <Link
                    href={pathHref(r.path)}
                    className={`${MONO} text-sm font-medium underline-offset-[3px] wrap-anywhere ${FOCUS}`}
                  >
                    {r.path}
                  </Link>
                </th>
                <td className="border-b border-vz-grid px-4 py-3.5 align-top text-[15px]">
                  {nf.format(r.views)}
                </td>
                {METRICS.map((m) => (
                  <td
                    key={m.key}
                    className="border-b border-vz-grid px-4 py-3.5 align-top"
                  >
                    <Cell
                      metric={m.metric}
                      p75={r[m.p]}
                      n={r[m.n]}
                      align="left"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
        {rows.map((r) => (
          <li
            key={r.path}
            className="rounded-xl bg-vz-surface px-4 pt-1 pb-2 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)]"
          >
            <div className="flex min-h-13 items-center justify-between gap-3 border-b border-vz-grid">
              <Link
                href={pathHref(r.path)}
                className={`${MONO} inline-flex min-h-11 items-center text-[15px] font-medium underline-offset-[3px] wrap-anywhere ${FOCUS}`}
              >
                {r.path}
              </Link>
              <span
                className={`${MONO} text-[13px] whitespace-nowrap text-vz-ink-2`}
              >
                {nf.format(r.views)} views
              </span>
            </div>
            <dl className="m-0">
              {METRICS.map((m, i) => (
                <div
                  key={m.key}
                  className={`flex items-start justify-between gap-3 py-2.5 ${i ? "border-t border-vz-grid" : ""}`}
                >
                  <dt
                    className={`${MONO} pt-0.5 text-xs font-medium text-vz-ink-2`}
                  >
                    {m.metric} p75
                  </dt>
                  <dd className="m-0 text-right">
                    <Cell
                      metric={m.metric}
                      p75={r[m.p]}
                      n={r[m.n]}
                      align="right"
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
