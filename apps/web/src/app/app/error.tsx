"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { FOCUS, SERIF } from "@/lib/ui";

/** Error boundary for the signed-in app. The header stays; the page content is replaced by this card. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // An error boundary swallows the error, so it has to be reported from here.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <Link
        href="/app"
        className={`inline-flex min-h-11 items-center text-sm text-vz-ink-2 no-underline hover:text-vz-ink ${FOCUS}`}
      >
        ← My sites
      </Link>
      <section
        role="alert"
        className="mt-3 rounded-[14px] bg-vz-surface p-5 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)] md:p-8"
      >
        <div className="flex items-start gap-3.5">
          <svg width="24" height="24" viewBox="0 0 14 14" aria-hidden="true" className="mt-[3px] flex-none">
            <path d="M7 .5L13.5 7 7 13.5.5 7z" fill="#d03b3b" />
            <path d="M5 5l4 4M9 5l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="min-w-0">
            <h1 className={`${SERIF} mb-2 text-2xl leading-[1.15] font-normal tracking-[-0.015em] md:text-[30px]`}>
              Something went wrong loading this site
            </h1>
            <p className="max-w-120 text-[15px] leading-[1.6] text-pretty text-vz-ink-2">
              Your data is safe. Try loading the page again.
            </p>
            {/* The real message is only shown while developing; production shows a generic error. */}
            {process.env.NODE_ENV !== "production" && (
              <pre className="mt-3 overflow-x-auto rounded-md bg-vz-page p-3 text-xs text-vz-ink-2">{error.message}</pre>
            )}
          </div>
        </div>
        <div className="mt-5.5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-12 w-full cursor-pointer rounded-lg bg-vz-ink px-5.5 text-[15px] font-medium text-vz-surface hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series md:w-auto"
          >
            Try again
          </button>
          <span className="text-[13px] text-vz-ink-2">This error was reported.</span>
        </div>
      </section>
    </div>
  );
}
