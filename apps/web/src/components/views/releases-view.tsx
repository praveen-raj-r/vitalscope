import { CopyButton } from "@/components/copy-button";
import { FilterScope } from "@/components/filter-scope";
import { ReleaseCompare } from "@/components/release-compare";
import { pickReleases } from "@/lib/compare";
import type { Filters } from "@/lib/filters";
import {
  fetchOverview,
  fetchReleaseSummary,
  type RpcClient,
} from "@/lib/stats";
import { CARD, MONO, SERIF } from "@/lib/ui";

const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const nf = new Intl.NumberFormat("en");

/** Compares two releases. `searchParams` carries the chosen releases (`a` and `b`). */
export async function ReleasesView({
  db,
  siteId,
  filters,
  searchParams,
  siteKey,
}: {
  db: RpcClient;
  siteId: string;
  filters: Filters;
  searchParams: Record<string, string | string[] | undefined>;
  /** When given, the "one release so far" card shows an install snippet that sets `release` (not shown in the demo). */
  siteKey?: string;
}) {
  const summary = await fetchReleaseSummary(db, siteId);
  const available = summary.map((r) => r.release);
  const { a, b } = pickReleases(searchParams, available);

  if (available.length < 2 || !a || !b) {
    const snippet = siteKey
      ? `import { init } from '@praveen-raj/vitalscope';\n\ninit({\n  siteKey: '${siteKey}',\n  release: '${available[0] ?? "1.0.0"}'\n});`
      : null;
    return (
      <section className={`${CARD} p-4.5 md:p-7`}>
        <h2
          className={`${SERIF} mb-2.5 text-[28px] leading-[1.15] font-normal tracking-[-0.015em]`}
        >
          {available.length === 1
            ? "Only one release so far"
            : "No releases yet"}
        </h2>
        <p className="mb-4.5 max-w-140 text-[15px] leading-[1.6] text-pretty text-vz-ink-2">
          Vitalscope compares releases once your site has reported two. Set{" "}
          <code className={`${MONO} text-[13.5px] font-medium text-vz-ink`}>
            release
          </code>{" "}
          in{" "}
          <code className={`${MONO} text-[13.5px] font-medium text-vz-ink`}>
            init
          </code>{" "}
          to your version, and change it with each deploy.
          {available.length === 1 && (
            <>
              {" "}
              Only release{" "}
              <span className={`${MONO} text-[13.5px] font-medium text-vz-ink`}>
                {available[0]}
              </span>{" "}
              has data so far.
            </>
          )}
        </p>
        {snippet && (
          <div className="relative rounded-xl bg-vz-ink text-[#f1f0ec]">
            <CopyButton
              text={snippet}
              ariaLabel="Copy snippet"
              className="absolute top-2 right-2 min-h-11 min-w-16 cursor-pointer rounded-[7px] bg-white/10 px-3.5 text-[13px] font-medium text-vz-surface hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
            <pre
              className={`${MONO} m-0 overflow-auto p-4.5 pt-14 text-[13.5px] leading-[1.75] whitespace-pre-wrap wrap-anywhere md:p-7 md:pt-14`}
            >
              {snippet}
            </pre>
          </div>
        )}
      </section>
    );
  }

  const [rowsA, rowsB] = await Promise.all([
    fetchOverview(db, siteId, { ...filters, release: a }),
    fetchOverview(db, siteId, { ...filters, release: b }),
  ]);

  return (
    <FilterScope
      filters={filters}
      releases={[]}
      compare={{ releases: available, a, b }}
    >
      {a === b ? (
        <p className={`${CARD} p-6 text-sm text-vz-ink-2`}>
          Pick two different releases to compare.
        </p>
      ) : (
        <ReleaseCompare a={a} b={b} rowsA={rowsA} rowsB={rowsB} />
      )}

      <section aria-label="Releases seen" className={`${CARD} mt-5 p-4 md:p-6`}>
        <h3 className="mb-1.5 text-[15px] leading-[1.35] font-semibold">
          Releases seen
        </h3>
        <table className="w-full border-collapse text-left text-sm tabular-nums">
          <caption className="sr-only">
            Releases with page views and the dates they were first and last seen
            (UTC)
          </caption>
          <thead>
            <tr className="text-xs text-vz-ink-2">
              <th
                scope="col"
                className="border-b border-vz-axis py-2 font-medium"
              >
                Release
              </th>
              <th
                scope="col"
                className="border-b border-vz-axis px-2 py-2 font-medium"
              >
                Page views
              </th>
              <th
                scope="col"
                className="border-b border-vz-axis py-2 font-medium"
              >
                First to last seen
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.map((r) => (
              <tr key={r.release}>
                <th
                  scope="row"
                  className={`${MONO} border-b border-vz-grid py-3 text-[13px] font-medium`}
                >
                  {r.release}
                </th>
                <td className="border-b border-vz-grid px-2 py-3">
                  {nf.format(r.views)}
                </td>
                <td className="border-b border-vz-grid py-3">
                  {dateFormat.format(new Date(r.first_seen))} to{" "}
                  {dateFormat.format(new Date(r.last_seen))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </FilterScope>
  );
}
