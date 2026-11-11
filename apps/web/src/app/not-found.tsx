import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { NotFoundCard } from "@/components/not-found-card";
import { FOCUS, SANS } from "@/lib/ui";

export const metadata: Metadata = { title: "Page not found · Vitalscope" };

/** 404 for any address that is not a page. (Inside the signed-in app, app/app/not-found.tsx is used instead.) */
export default function NotFound() {
  return (
    <div className={`min-h-screen bg-vz-page text-vz-ink ${SANS}`}>
      <header className="border-b border-vz-border bg-vz-surface">
        <div className="mx-auto flex h-16 max-w-240 items-center justify-between gap-3 px-5 md:px-10">
          <Link
            href="/"
            className={`flex min-h-11 items-center gap-2.5 text-[17px] font-medium tracking-[-0.01em] no-underline ${FOCUS}`}
          >
            <Logo />
            Vitalscope
          </Link>
          <nav aria-label="Primary" className="flex gap-1 text-[15px]">
            <Link
              href="/demo"
              className={`flex min-h-11 items-center px-3 text-vz-ink-2 no-underline hover:text-vz-ink ${FOCUS}`}
            >
              Demo
            </Link>
            <Link href="/login" className={`flex min-h-11 items-center px-3 font-medium no-underline ${FOCUS}`}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-240 px-5 pt-7 pb-18 md:px-10 md:pt-12">
        <NotFoundCard href="/" label="Back to home" />
      </main>
    </div>
  );
}
