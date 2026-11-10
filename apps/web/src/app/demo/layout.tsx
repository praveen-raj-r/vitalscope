import type { Metadata } from "next";
import Link from "next/link";
import { SiteTabs } from "@/components/site-tabs";
import { GITHUB_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Demo · Vitalscope",
  description: "A read-only Vitalscope dashboard on sample data. No sign-in needed.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="font-semibold text-vz-ink">
          Vitalscope
        </Link>
        <nav aria-label="Site" className="flex gap-4 text-sm text-vz-ink-2">
          <a href={GITHUB_URL} className="underline hover:text-vz-ink">
            GitHub
          </a>
          <Link href="/login" className="underline hover:text-vz-ink">
            Sign in
          </Link>
        </nav>
      </header>

      <div role="note" className="mt-6 rounded-lg border border-vz-border bg-vz-page p-4 text-sm text-vz-ink-2">
        <strong className="text-vz-ink">This is sample data.</strong> The page views below were generated for this demo
        and are not real traffic. The dashboard is read-only.
      </div>

      <h1 className="mt-6 text-2xl font-semibold">Sample site</h1>
      <SiteTabs basePath="/demo" />
      <div className="mt-6">{children}</div>
    </div>
  );
}
