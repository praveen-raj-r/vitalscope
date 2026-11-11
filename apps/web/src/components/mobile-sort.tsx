"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FOCUS } from "@/lib/ui";

const BOX =
  "min-h-12.5 rounded-[10px] bg-vz-surface shadow-[inset_0_0_0_1px_rgb(11_11_11/0.14)]";

/** Sort picker for the stacked pages list on small screens, where there are no column headers to click. */
export function MobileSort({
  options,
  current,
  flipHref,
  dir,
}: {
  options: { key: string; label: string; href: string }[];
  current: string;
  flipHref: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  return (
    <div className="mb-3.5 flex items-end gap-2.5 md:hidden">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="mobile-sort" className="text-xs font-medium text-vz-ink-2">
          Sort by
        </label>
        <select
          id="mobile-sort"
          value={current}
          onChange={(e) => {
            const o = options.find((x) => x.key === e.target.value);
            if (o) router.replace(o.href, { scroll: false });
          }}
          className={`${BOX} px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series`}
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Link
        href={flipHref}
        replace
        scroll={false}
        aria-label="Reverse sort direction"
        className={`${BOX} flex min-w-12.5 items-center gap-2 px-3.5 text-sm font-medium text-vz-ink no-underline hover:bg-[#efeee9] ${FOCUS}`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d={dir === "desc" ? "M5 9L1 2h8z" : "M5 1l4 7H1z"} fill="#0b0b0b" />
        </svg>
        {dir === "desc" ? "High to low" : "Low to high"}
      </Link>
    </div>
  );
}
