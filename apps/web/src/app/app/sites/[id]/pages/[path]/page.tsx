import Link from "next/link";
import { notFound } from "next/navigation";
import { AttributionTable } from "@/components/attribution-table";
import { FilterScope } from "@/components/filter-scope";
import { HistogramCard } from "@/components/histogram-card";
import { StatTile } from "@/components/stat-tile";
import { filtersToParams, parseFilters } from "@/lib/filters";
import { decodePathId } from "@/lib/path-id";
import { fetchAttribution, fetchHistogram, fetchPathOverview, fetchReleases, overviewFor } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { HEADLINE_METRICS } from "@/lib/vitals";

export default async function PageDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; path: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, path: pathId } = await params;
  const path = decodePathId(pathId);
  if (!path) notFound();

  const filters = parseFilters(await searchParams);
  const supabase = await createClient();

  const [overview, releases, histograms, attributions] = await Promise.all([
    fetchPathOverview(supabase, id, path, filters),
    fetchReleases(supabase, id),
    Promise.all(HEADLINE_METRICS.map((m) => fetchHistogram(supabase, id, path, m, filters))),
    Promise.all(HEADLINE_METRICS.map((m) => fetchAttribution(supabase, id, path, m, filters))),
  ]);

  return (
    <div>
      <Link
        href={`/app/sites/${id}/pages?${filtersToParams(filters).toString()}`}
        className="text-sm text-vz-ink-2 underline hover:text-vz-ink"
      >
        ← All pages
      </Link>
      <h2 className="mb-6 mt-2 break-all font-mono text-lg font-semibold text-vz-ink">{path}</h2>

      <FilterScope filters={filters} releases={releases}>
        {overview.length === 0 ? (
          <p className="rounded-lg border border-vz-border bg-vz-surface p-6 text-sm text-vz-ink-2">
            No data for this page with these filters. Try a longer date range, or set device and release back to All.
          </p>
        ) : (
          <div className="space-y-6">
            <section aria-label="Core Web Vitals for this page, 75th percentile" className="grid gap-4 sm:grid-cols-3">
              {HEADLINE_METRICS.map((m) => (
                <StatTile key={m} metric={m} row={overviewFor(overview, m)} />
              ))}
            </section>

            <div className="space-y-4">
              {HEADLINE_METRICS.map((m, i) => (
                <HistogramCard key={m} metric={m} rows={histograms[i] ?? []} />
              ))}
            </div>

            <div className="space-y-4">
              {HEADLINE_METRICS.map((m, i) => (
                <AttributionTable key={m} metric={m} rows={attributions[i] ?? []} />
              ))}
            </div>
          </div>
        )}
      </FilterScope>
    </div>
  );
}
