import Link from "next/link";
import { RatingShape } from "./rating";
import { filtersToParams, type Filters } from "@/lib/filters";
import { nextDir, type PageRow, type SortDir, type SortKey } from "@/lib/pages-table";
import { encodePathId } from "@/lib/path-id";
import { formatValue, hasEnoughData, MIN_SAMPLES, rate, type MetricKey } from "@/lib/vitals";

const nf = new Intl.NumberFormat("en");

function Cell({ metric, p75, n }: { metric: MetricKey; p75: number | null; n: number }) {
  if (p75 === null || n === 0) return <span className="text-vz-muted">no data</span>;
  const enough = hasEnoughData(n);
  return (
    <span className="inline-flex items-center gap-1.5">
      {enough && <RatingShape rating={rate(metric, p75)} size={10} />}
      <span className={enough ? "text-vz-ink" : "text-vz-muted"}>{formatValue(metric, p75)}</span>
      <span className="text-xs text-vz-muted">
        n={n}
        {!enough && ` · under ${MIN_SAMPLES}`}
      </span>
    </span>
  );
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "path", label: "Path" },
  { key: "views", label: "Views" },
  { key: "lcp", label: "LCP p75" },
  { key: "inp", label: "INP p75" },
  { key: "cls", label: "CLS p75" },
];

/** Column headers are links, so sorting works with the keyboard and without client JavaScript. */
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
  const href = (key: SortKey) => {
    const params = filtersToParams(filters);
    params.set("sort", key);
    params.set("dir", nextDir(sort, key));
    return `${basePath}/pages?${params.toString()}`;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-vz-border bg-vz-surface">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">
          Pages with views and p75 per metric. Sorted by {sort.key}, {sort.dir === "asc" ? "ascending" : "descending"}.
        </caption>
        <thead>
          <tr className="border-b border-vz-grid text-xs text-vz-ink-2">
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                className="px-4 py-3 font-medium"
              >
                <Link href={href(c.key)} className="inline-flex items-center gap-1 hover:text-vz-ink">
                  {c.label}
                  {sort.key === c.key && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className="border-t border-vz-grid">
              <th scope="row" className="max-w-xs truncate px-4 py-3 font-mono text-xs font-normal text-vz-ink" title={r.path}>
                <Link
                  href={`${basePath}/pages/${encodePathId(r.path)}?${filtersToParams(filters).toString()}`}
                  className="underline hover:text-vz-series"
                >
                  {r.path}
                </Link>
              </th>
              <td className="px-4 py-3 tabular-nums">{nf.format(r.views)}</td>
              <td className="px-4 py-3 tabular-nums">
                <Cell metric="LCP" p75={r.lcp_p75} n={r.lcp_n} />
              </td>
              <td className="px-4 py-3 tabular-nums">
                <Cell metric="INP" p75={r.inp_p75} n={r.inp_n} />
              </td>
              <td className="px-4 py-3 tabular-nums">
                <Cell metric="CLS" p75={r.cls_p75} n={r.cls_n} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
