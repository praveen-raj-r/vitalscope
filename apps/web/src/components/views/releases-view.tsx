import { FilterScope } from "@/components/filter-scope";
import { ReleaseCompare } from "@/components/release-compare";
import { pickReleases } from "@/lib/compare";
import type { Filters } from "@/lib/filters";
import { fetchOverview, fetchReleaseSummary, type RpcClient } from "@/lib/stats";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const nf = new Intl.NumberFormat("en");

/** Compares two releases. `searchParams` carries the chosen releases (`a` and `b`). */
export async function ReleasesView({
  db,
  siteId,
  filters,
  searchParams,
}: {
  db: RpcClient;
  siteId: string;
  filters: Filters;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const summary = await fetchReleaseSummary(db, siteId);
  const available = summary.map((r) => r.release);
  const { a, b } = pickReleases(searchParams, available);

  if (available.length < 2 || !a || !b) {
    return (
      <div className="rounded-lg border border-vz-border bg-vz-surface p-6">
        <h2 className="text-lg font-semibold text-vz-ink">Not enough releases to compare</h2>
        <p className="mt-1 text-sm text-vz-ink-2">
          Pass a <code className="font-mono">release</code> to <code className="font-mono">init()</code> in the SDK, for
          example your app version. Once two different releases have reported data, they can be compared here.
          {available.length === 1 && (
            <>
              {" "}
              Only release <span className="font-mono">{available[0]}</span> has data so far.
            </>
          )}
        </p>
      </div>
    );
  }

  const [rowsA, rowsB] = await Promise.all([
    fetchOverview(db, siteId, { ...filters, release: a }),
    fetchOverview(db, siteId, { ...filters, release: b }),
  ]);

  return (
    <FilterScope filters={filters} releases={[]} compare={{ releases: available, a, b }}>
      <div className="space-y-4">
        <p className="text-sm text-vz-ink-2">
          Change is the new p75 against the baseline p75. For all three metrics lower is better, and a change is only shown
          when both releases have at least 30 samples. The date range applies to both releases.
        </p>

        {a === b ? (
          <p className="rounded-lg border border-vz-border bg-vz-surface p-6 text-sm text-vz-ink-2">
            Pick two different releases to compare.
          </p>
        ) : (
          <ReleaseCompare a={a} b={b} rowsA={rowsA} rowsB={rowsB} />
        )}

        <section aria-label="Releases seen" className="rounded-lg border border-vz-border bg-vz-surface p-5">
          <h3 className="text-sm font-medium text-vz-ink">Releases seen</h3>
          <table className="mt-2 w-full text-left text-sm">
            <caption className="sr-only">Releases with page views and the dates they were first and last seen (UTC)</caption>
            <thead>
              <tr className="text-xs text-vz-ink-2">
                <th scope="col" className="py-1 pr-4 font-medium">
                  Release
                </th>
                <th scope="col" className="py-1 pr-4 font-medium">
                  Page views
                </th>
                <th scope="col" className="py-1 font-medium">
                  First to last seen
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {summary.map((r) => (
                <tr key={r.release} className="border-t border-vz-grid">
                  <th scope="row" className="py-1 pr-4 font-mono text-xs font-normal text-vz-ink">
                    {r.release}
                  </th>
                  <td className="py-1 pr-4">{nf.format(r.views)}</td>
                  <td className="py-1">
                    {dateFormat.format(new Date(r.first_seen))} to {dateFormat.format(new Date(r.last_seen))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </FilterScope>
  );
}
