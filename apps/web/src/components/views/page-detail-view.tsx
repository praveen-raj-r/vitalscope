import Link from "next/link";
import { AttributionTable } from "@/components/attribution-table";
import { FilterScope } from "@/components/filter-scope";
import { HistogramCard } from "@/components/histogram-card";
import { StatTile } from "@/components/stat-tile";
import { filtersToParams, type Filters } from "@/lib/filters";
import {
  fetchAttribution,
  fetchHistogram,
  fetchPathOverview,
  fetchReleases,
  overviewFor,
  type RpcClient,
} from "@/lib/stats";
import { CARD, FOCUS, MONO, SERIF } from "@/lib/ui";
import { hasEnoughData, HEADLINE_METRICS } from "@/lib/vitals";

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
    Promise.all(
      HEADLINE_METRICS.map((m) => fetchHistogram(db, siteId, path, m, filters)),
    ),
    Promise.all(
      HEADLINE_METRICS.map((m) =>
        fetchAttribution(db, siteId, path, m, filters),
      ),
    ),
  ]);

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="flex min-h-11 items-center gap-2 text-sm text-vz-ink-2"
      >
        <Link
          href={`${basePath}/pages?${filtersToParams(filters).toString()}`}
          className={`inline-flex min-h-11 items-center no-underline hover:text-vz-ink ${FOCUS}`}
        >
          Pages
        </Link>
        <span aria-hidden="true">/</span>
        <span
          aria-current="page"
          className={`${MONO} min-w-0 text-vz-ink wrap-anywhere`}
        >
          {path}
        </span>
      </nav>
      <h2
        className={`${MONO} mt-1 mb-6 text-[26px] leading-[1.15] font-medium tracking-[-0.02em] wrap-anywhere md:text-[32px]`}
      >
        {path}
      </h2>

      <FilterScope filters={filters} releases={releases}>
        {overview.length === 0 ? (
          <div className={`${CARD} px-4 py-10 text-center md:px-6 md:py-16`}>
            <div
              className={`${SERIF} text-[26px] leading-[1.2] tracking-[-0.015em]`}
            >
              No data for this page
            </div>
            <p className="mx-auto mt-2.5 max-w-105 text-[15px] leading-[1.55] text-pretty text-vz-ink-2">
              Try a longer time range, or set device and release back to All.
            </p>
          </div>
        ) : (
          <>
            <section
              aria-label="Core Web Vitals for this page, 75th percentile"
              className="grid gap-4 md:grid-cols-3"
            >
              {HEADLINE_METRICS.map((m) => (
                <StatTile key={m} metric={m} row={overviewFor(overview, m)} />
              ))}
            </section>

            <div className="mt-5 flex flex-col gap-4">
              {HEADLINE_METRICS.map((m, i) => {
                const row = overviewFor(overview, m);
                return (
                  <HistogramCard
                    key={m}
                    metric={m}
                    rows={histograms[i] ?? []}
                    p75={row?.p75}
                    have={
                      row && !hasEnoughData(row.samples)
                        ? row.samples
                        : undefined
                    }
                  />
                );
              })}
            </div>

            <h2
              className={`${SERIF} mt-11 mb-1.5 text-[28px] leading-[1.15] font-normal tracking-[-0.015em]`}
            >
              Attribution
            </h2>
            <p className="mb-4 text-sm leading-[1.55] text-vz-ink-2">
              What is slow on this page, as reported by visitors&apos; browsers.
            </p>
            <div className="flex flex-col gap-4">
              {HEADLINE_METRICS.map((m, i) => (
                <AttributionTable
                  key={m}
                  metric={m}
                  rows={attributions[i] ?? []}
                />
              ))}
            </div>
          </>
        )}
      </FilterScope>
    </div>
  );
}
