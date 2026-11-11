import type { Metadata } from "next";
import Link from "next/link";
import { GitHubMark, Logo } from "@/components/brand";
import { DemoUnavailable } from "@/components/demo-unavailable";
import { SiteTabs } from "@/components/site-tabs";
import { demoSiteId } from "@/lib/demo";
import { GITHUB_URL } from "@/lib/site-config";
import { FOCUS, SANS, SERIF } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Demo · Vitalscope",
  description:
    "A read-only Vitalscope dashboard on sample data. No sign-in needed.",
};

const WRAP = "mx-auto max-w-240 px-5 md:px-10";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = demoSiteId() !== null;
  return (
    <div
      className={`flex min-h-screen flex-col bg-vz-page text-vz-ink ${SANS}`}
    >
      <aside
        role="region"
        aria-label="Demo notice"
        className="sticky top-0 z-5 bg-vz-ink text-vz-surface"
      >
        <div
          className={`${WRAP} flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 py-3 md:py-2.5`}
        >
          <div className="flex min-w-0 flex-[1_1_280px] items-center gap-2.5">
            <span className="flex-none rounded-full px-2 py-0.75 font-mono text-[11px] font-medium tracking-[0.08em] uppercase shadow-[inset_0_0_0_1px_rgb(252_252_251/0.5)]">
              Demo
            </span>
            <span className="text-sm leading-[1.4]">
              <strong className="font-semibold">
                Live demo with synthetic sample data.
              </strong>{" "}
              <span className="text-[#d9d7cd]">Read-only.</span>
            </span>
          </div>
          <div className="flex flex-[1_1_100%] gap-2 md:flex-none">
            <Link
              href="/login"
              className="inline-flex min-h-11 flex-auto items-center justify-center gap-2 rounded-lg bg-vz-surface px-3.5 text-sm font-medium whitespace-nowrap text-vz-ink no-underline hover:bg-[#e9e8e2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <GitHubMark size={16} />
              Sign in with GitHub
            </Link>
            <Link
              href="/#install"
              className="inline-flex min-h-11 flex-auto items-center justify-center rounded-lg px-3.5 text-sm font-medium whitespace-nowrap text-vz-surface no-underline shadow-[inset_0_0_0_1px_rgb(252_252_251/0.55)] hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Install the SDK
            </Link>
          </div>
        </div>
      </aside>

      <header className="border-b border-vz-border bg-vz-surface">
        <div className={`${WRAP} flex h-16 items-center justify-between gap-3`}>
          <Link
            href="/"
            className={`flex min-h-11 items-center gap-2.5 text-[17px] font-medium tracking-[-0.01em] no-underline ${FOCUS}`}
          >
            <Logo />
            Vitalscope
          </Link>
          <nav aria-label="Primary" className="flex gap-1 text-[15px]">
            <a
              href={GITHUB_URL}
              className={`flex min-h-11 items-center px-3 text-vz-ink-2 no-underline hover:text-vz-ink ${FOCUS}`}
            >
              GitHub
            </a>
            <Link
              href="/login"
              className={`flex min-h-11 items-center px-0 font-medium text-vz-ink no-underline md:pr-3 md:pl-3 ${FOCUS}`}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className={`${WRAP} w-full flex-1 pt-6 pb-18`}>
        {configured ? (
          <>
            <h1
              className={`${SERIF} mb-5 text-[28px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[40px]`}
            >
              Sample data
            </h1>
            <SiteTabs basePath="/demo" />
            <div className="mt-6">{children}</div>
          </>
        ) : (
          <DemoUnavailable />
        )}
      </main>

      <footer className="border-t border-vz-border bg-vz-surface">
        <div
          className={`${WRAP} flex min-h-18 items-center justify-between gap-3 text-[13px] text-vz-ink-2`}
        >
          <span>Vitalscope · MIT licence</span>
          <a
            href={GITHUB_URL}
            className={`flex min-h-11 items-center text-vz-ink-2 ${FOCUS}`}
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
