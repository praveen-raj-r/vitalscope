"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // An error boundary swallows the error, so it has to be reported from here.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-4 gap-y-3.5 rounded-[14px] bg-vz-surface px-5.5 py-5 shadow-[inset_0_0_0_1px_#d03b3b]"
    >
      <svg width="20" height="20" viewBox="0 0 14 14" aria-hidden="true" className="flex-none">
        <rect x="1" y="1" width="12" height="12" rx="2.5" fill="#d03b3b" transform="rotate(45 7 7) scale(.86) translate(1 1)" />
        <path d="M5 5l4 4M9 5l-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="min-w-45 flex-1 text-base font-medium">Could not load dashboard data.</span>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 cursor-pointer rounded-lg bg-vz-ink px-5 text-sm font-medium text-vz-surface hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series"
      >
        Try again
      </button>
      {/* The real message is only shown while developing; production shows a generic error. */}
      {process.env.NODE_ENV !== "production" && (
        <pre className="basis-full overflow-x-auto rounded-md bg-vz-page p-3 text-xs text-vz-ink-2">{error.message}</pre>
      )}
    </div>
  );
}
