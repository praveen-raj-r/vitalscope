import { FilterScope } from "@/components/filter-scope";
import { PagesTable } from "@/components/pages-table";
import type { Filters } from "@/lib/filters";
import { sortPages, type SortDir, type SortKey } from "@/lib/pages-table";
import { fetchPages, fetchReleases, type RpcClient } from "@/lib/stats";

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

  return (
    <FilterScope filters={filters} releases={releases}>
      {pages.length === 0 ? (
        <p className="rounded-lg border border-vz-border bg-vz-surface p-6 text-sm text-vz-ink-2">
          No pages with data for these filters yet.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-vz-ink-2">
            Slowest LCP first by default. Numbers under 30 samples are greyed out. Click a column to sort.
          </p>
          <PagesTable basePath={basePath} rows={sortPages(pages, sort.key, sort.dir)} sort={sort} filters={filters} />
        </>
      )}
    </FilterScope>
  );
}
