import { FilterScope } from "@/components/filter-scope";
import { InstallEmptyState } from "@/components/install-empty-state";
import { StatTile } from "@/components/stat-tile";
import { TrendCard } from "@/components/trend-card";
import { hasActiveFilters, parseFilters } from "@/lib/filters";
import { fetchOverview, fetchReleases, fetchTrend, overviewFor, trendFor } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { HEADLINE_METRICS } from "@/lib/vitals";

export default async function SiteOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const filters = parseFilters(await searchParams);
  const supabase = await createClient();

  const [overview, trend, releases, siteRes] = await Promise.all([
    fetchOverview(supabase, id, filters),
    fetchTrend(supabase, id, filters),
    fetchReleases(supabase, id),
    supabase.from("sites").select("site_key").eq("id", id).single(),
  ]);

  const endpoint = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/ingest`;
  const empty = overview.length === 0;

  return (
    <FilterScope filters={filters} releases={releases}>
      {empty ? (
        <InstallEmptyState
          siteKey={siteRes.data?.site_key ?? ""}
          endpoint={endpoint}
          filtered={hasActiveFilters(filters)}
        />
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
