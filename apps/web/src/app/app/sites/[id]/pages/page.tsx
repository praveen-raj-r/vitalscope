import { FilterScope } from "@/components/filter-scope";
import { PagesTable } from "@/components/pages-table";
import { parseFilters } from "@/lib/filters";
import { parseSort, sortPages } from "@/lib/pages-table";
import { fetchPages, fetchReleases } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function SitePagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const sort = parseSort(sp);
  const supabase = await createClient();

  const [pages, releases] = await Promise.all([fetchPages(supabase, id, filters), fetchReleases(supabase, id)]);

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
          <PagesTable siteId={id} rows={sortPages(pages, sort.key, sort.dir)} sort={sort} filters={filters} />
        </>
      )}
    </FilterScope>
  );
}
