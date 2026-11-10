"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DAY_OPTIONS, DEVICE_OPTIONS, filtersToParams, type Filters } from "@/lib/filters";

interface CompareProps {
  /** Releases the user can pick from, newest first. */
  releases: string[];
  a: string | null;
  b: string | null;
}

const SELECT_CLASS = "mt-1 block rounded-md border border-vz-axis bg-vz-surface px-2 py-1.5 text-sm text-vz-ink";

/**
 * One filter row above everything it scopes. Changing a filter updates the URL, so the server renders the
 * new numbers; meanwhile the content below keeps its frame and dims, instead of flashing a skeleton.
 *
 * With `compare`, the single Release filter is replaced by a Baseline and a Compare release picker
 * (the release comparison page), stored in the `a` and `b` URL parameters.
 */
export function FilterScope({
  filters,
  releases,
  compare,
  children,
}: {
  filters: Filters;
  releases: string[];
  compare?: CompareProps;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(params: URLSearchParams) {
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function update(next: Filters) {
    go(filtersToParams(next, new URLSearchParams(search.toString())));
  }

  function setParam(key: "a" | "b", value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    go(params);
  }

  // A release in the URL that has no events in the list must still be selectable, so the select stays truthful.
  const releaseOptions = filters.release && !releases.includes(filters.release) ? [filters.release, ...releases] : releases;

  return (
    <div>
      <div role="group" aria-label="Filters" className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <span id="range-label" className="block text-xs text-vz-ink-2">
            Date range
          </span>
          <div role="group" aria-labelledby="range-label" className="mt-1 inline-flex overflow-hidden rounded-md border border-vz-axis">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={filters.days === d}
                onClick={() => update({ ...filters, days: d })}
                className={`px-3 py-1.5 text-sm ${filters.days === d ? "bg-vz-ink font-medium text-vz-surface" : "bg-vz-surface text-vz-ink hover:bg-vz-grid"}`}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </div>

        <label className="text-xs text-vz-ink-2">
          Device
          <select
            className={SELECT_CLASS}
            value={filters.device ?? ""}
            onChange={(e) => update({ ...filters, device: (e.target.value || null) as Filters["device"] })}
          >
            <option value="">All devices</option>
            {DEVICE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d[0]!.toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {compare ? (
          <>
            <label className="text-xs text-vz-ink-2">
              Baseline release
              <select className={SELECT_CLASS} value={compare.a ?? ""} onChange={(e) => setParam("a", e.target.value)}>
                {compare.a === null && <option value="">No release</option>}
                {compare.releases.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-vz-ink-2">
              Compare release
              <select className={SELECT_CLASS} value={compare.b ?? ""} onChange={(e) => setParam("b", e.target.value)}>
                {compare.b === null && <option value="">No release</option>}
                {compare.releases.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="text-xs text-vz-ink-2">
            Release
            <select
              className={SELECT_CLASS}
              value={filters.release ?? ""}
              onChange={(e) => update({ ...filters, release: e.target.value || null })}
            >
              <option value="">All releases</option>
              {releaseOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div aria-busy={pending} className={`mt-6 transition-opacity ${pending ? "opacity-50" : ""}`}>
        {children}
      </div>
    </div>
  );
}
