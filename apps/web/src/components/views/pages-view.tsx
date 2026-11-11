import { FilterScope } from "@/components/filter-scope";
import { PagesTable } from "@/components/pages-table";
import type { Filters } from "@/lib/filters";
import { sortPages, type SortDir, type SortKey } from "@/lib/pages-table";
import { fetchPages, fetchReleases, type RpcClient } from "@/lib/stats";
import { CARD, SERIF } from "@/lib/ui";
import { MIN_SAMPLES } from "@/lib/vitals";

const SORT_NAMES: Record<SortKey, string> = {
  path: "path",
  views: "views",
  lcp: "LCP p75",
  inp: "INP p75",
  cls: "CLS p75",
};

/** The pages table. `basePath` is where its links point: `/app/sites/<id>` or `/demo`. */
export async function PagesView({
  db,
  siteId,
  basePath,
  filters,
  sort,
}: {
  db: RpcClient;
  siteId: string;
  basePath: string;
  filters: Filters;
  sort: { key: SortKey; dir: SortDir };
}) {
  const [pages, releases] = await Promise.all([fetchPages(db, siteId, filters), fetchReleases(db, siteId)]);
  const order =
    sort.key === "path"
      ? sort.dir === "asc"
        ? "A to Z"
        : "Z to A"
      : sort.dir === "desc"
        ? "high to low"
        : "low to high";

  return (
    <FilterScope filters={filters} releases={releases}>
      {pages.length === 0 ? (
        <div className={`${CARD} px-4 py-10 text-center md:px-6 md:py-16`}>
          <div className={`${SERIF} text-[26px] leading-[1.2] tracking-[-0.015em]`}>No page data in this range</div>
          <p className="mx-auto mt-2.5 max-w-105 text-[15px] leading-[1.55] text-pretty text-vz-ink-2">
            Try a longer time range, or change the device or release filter.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3.5 text-sm leading-[1.55] text-pretty text-vz-ink-2" aria-live="polite">
            Sorted by {SORT_NAMES[sort.key]}, {order}. Numbers under {MIN_SAMPLES} samples are marked not enough data.
          </p>
          <PagesTable basePath={basePath} rows={sortPages(pages, sort.key, sort.dir)} sort={sort} filters={filters} />
        </>
      )}
    </FilterScope>
  );
}
