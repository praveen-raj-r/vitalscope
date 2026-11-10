import Link from "next/link";
import { AttributionTable } from "@/components/attribution-table";
import { FilterScope } from "@/components/filter-scope";
import { HistogramCard } from "@/components/histogram-card";
import { StatTile } from "@/components/stat-tile";
import { filtersToParams, type Filters } from "@/lib/filters";
import { fetchAttribution, fetchHistogram, fetchPathOverview, fetchReleases, overviewFor, type RpcClient } from "@/lib/stats";
import { HEADLINE_METRICS } from "@/lib/vitals";

/** One page: p75 tiles, a distribution per metric and what is slow. Shared by the dashboard and the public demo. */
export async function PageDetailView({
  db,
  siteId,
  basePath,
  path,
  filters,
}: {
  db: RpcClient;
  siteId: string;
  basePath: string;
  path: string;
  filters: Filters;
}) {
  const [overview, releases, histograms, attributions] = await Promise.all([
    fetchPathOverview(db, siteId, path, filters),
    fetchReleases(db, siteId),
    Promise.all(HEADLINE_METRICS.map((m) => fetchHistogram(db, siteId, path, m, filters))),
    Promise.all(HEADLINE_METRICS.map((m) => fetchAttribution(db, siteId, path, m, filters))),
  ]);

  return (
    <div>
      <Link
        href={`${basePath}/pages?${filtersToParams(filters).toString()}`}
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
