"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Tabs keep the active filters (days, device, release) when switching between views.
 * `basePath` is `/app/sites/<id>` in the signed-in dashboard and `/demo` in the public demo.
 */
export function SiteTabs({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const kept = new URLSearchParams();
  for (const key of ["days", "device", "release"]) {
    const value = search.get(key);
    if (value) kept.set(key, value);
  }
  const qs = kept.toString() ? `?${kept.toString()}` : "";

  const base = basePath;
  const tabs = [
    { label: "Overview", href: base, active: pathname === base },
    { label: "Pages", href: `${base}/pages`, active: pathname.startsWith(`${base}/pages`) },
    { label: "Releases", href: `${base}/releases`, active: pathname.startsWith(`${base}/releases`) },
  ];

  return (
    <nav aria-label="Site sections" className="flex gap-3.5 border-b border-vz-grid md:gap-5">
      {tabs.map((t) => (
        <Link
          key={t.label}
          href={`${t.href}${qs}`}
          aria-current={t.active ? "page" : undefined}
          className={`-mb-px flex min-h-12 items-center border-b-2 px-1 text-[15px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-vz-series ${t.active ? "border-vz-ink font-semibold text-vz-ink" : "border-transparent text-vz-ink-2 hover:text-vz-ink"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
