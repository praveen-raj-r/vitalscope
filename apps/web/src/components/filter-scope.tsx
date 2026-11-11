"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  DAY_OPTIONS,
  DEVICE_OPTIONS,
  filtersToParams,
  type Filters,
} from "@/lib/filters";

interface CompareProps {
  /** Releases the user can pick from, newest first. */
  releases: string[];
  a: string | null;
  b: string | null;
}

const SELECT_CLASS =
  "block min-h-12.5 rounded-[10px] bg-vz-surface px-3 text-[15px] text-vz-ink shadow-[inset_0_0_0_1px_rgb(11_11_11/0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series";
const LABEL_CLASS =
  "flex min-w-32 flex-[1_1_130px] flex-col gap-1.5 text-xs font-medium text-vz-ink-2 md:flex-none [&>select]:w-full";

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
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
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
  const releaseOptions =
    filters.release && !releases.includes(filters.release)
      ? [filters.release, ...releases]
      : releases;

  return (
    <div>
      <div
        role="group"
        aria-label="Filters"
        className="flex flex-wrap items-start gap-x-6 gap-y-4"
      >
        <div className="flex w-full flex-none flex-col gap-1.5 md:w-auto">
          <span id="range-label" className="text-xs font-medium text-vz-ink-2">
            Time range
          </span>
          <div
            role="group"
            aria-labelledby="range-label"
            className="flex min-h-12.5 rounded-[10px] bg-vz-surface p-0.75 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.14)]"
          >
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={filters.days === d}
                onClick={() => update({ ...filters, days: d })}
                className={`min-h-11 flex-1 cursor-pointer rounded-[7px] px-3.5 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series ${filters.days === d ? "bg-vz-ink text-vz-surface" : "text-vz-ink hover:bg-[#efeee9]"}`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        <label className={LABEL_CLASS}>
          Device
          <select
            className={SELECT_CLASS}
            value={filters.device ?? ""}
            onChange={(e) =>
              update({
                ...filters,
                device: (e.target.value || null) as Filters["device"],
              })
            }
          >
            <option value="">All</option>
            {DEVICE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d[0]!.toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {compare ? (
          <>
            <label className={LABEL_CLASS}>
              Baseline release
              <select
                className={SELECT_CLASS}
                value={compare.a ?? ""}
                onChange={(e) => setParam("a", e.target.value)}
              >
                {compare.a === null && <option value="">No release</option>}
                {compare.releases.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className={LABEL_CLASS}>
              Compare release
              <select
                className={SELECT_CLASS}
                value={compare.b ?? ""}
                onChange={(e) => setParam("b", e.target.value)}
              >
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
          <label className={LABEL_CLASS}>
            Release
            <select
              className={SELECT_CLASS}
              value={filters.release ?? ""}
              onChange={(e) =>
                update({ ...filters, release: e.target.value || null })
              }
            >
              <option value="">All</option>
              {releaseOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div
        aria-busy={pending}
        className={`mt-7 transition-opacity ${pending ? "opacity-50" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
