"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Tabs keep the active filters (days, device, release) when switching between views. */
export function SiteTabs({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const kept = new URLSearchParams();
  for (const key of ["days", "device", "release"]) {
    const value = search.get(key);
    if (value) kept.set(key, value);
  }
  const qs = kept.toString() ? `?${kept.toString()}` : "";

  const base = `/app/sites/${siteId}`;
  const tabs = [
    { label: "Overview", href: base, active: pathname === base },
    { label: "Pages", href: `${base}/pages`, active: pathname.startsWith(`${base}/pages`) },
    { label: "Releases", href: `${base}/releases`, active: pathname.startsWith(`${base}/releases`) },
  ];

  return (
    <nav aria-label="Site sections" className="mt-4 flex gap-1 border-b border-vz-grid">
      {tabs.map((t) => (
        <Link
          key={t.label}
          href={`${t.href}${qs}`}
          aria-current={t.active ? "page" : undefined}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${t.active ? "border-vz-ink font-medium text-vz-ink" : "border-transparent text-vz-ink-2 hover:text-vz-ink"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
