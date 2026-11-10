import { FilterScope } from "@/components/filter-scope";
import { StatTile } from "@/components/stat-tile";
import { TrendCard } from "@/components/trend-card";
import type { Filters } from "@/lib/filters";
import { fetchOverview, fetchReleases, fetchTrend, overviewFor, trendFor, type RpcClient } from "@/lib/stats";
import { HEADLINE_METRICS } from "@/lib/vitals";

/** The site overview: p75 tiles and trend charts. Shared by the signed-in dashboard and the public demo. */
export async function OverviewView({
  db,
  siteId,
  filters,
  empty,
}: {
  db: RpcClient;
  siteId: string;
  filters: Filters;
  /** Shown instead of the numbers when there is no data (the install snippet in the dashboard). */
  empty: React.ReactNode;
}) {
  const [overview, trend, releases] = await Promise.all([
    fetchOverview(db, siteId, filters),
    fetchTrend(db, siteId, filters),
    fetchReleases(db, siteId),
  ]);

  return (
    <FilterScope filters={filters} releases={releases}>
      {overview.length === 0 ? (
        empty
      ) : (
        <div className="space-y-6">
          <section aria-label="Core Web Vitals, 75th percentile" className="grid gap-4 sm:grid-cols-3">
            {HEADLINE_METRICS.map((m) => (
              <StatTile key={m} metric={m} row={overviewFor(overview, m)} />
            ))}
          </section>
          <div className="space-y-4">
            {HEADLINE_METRICS.map((m) => (
              <TrendCard
                key={m}
                metric={m}
                days={filters.days}
                points={trendFor(trend, m).map((r) => ({ day: r.day, p75: r.p75, samples: r.samples }))}
              />
            ))}
          </div>
        </div>
      )}
    </FilterScope>
  );
}
