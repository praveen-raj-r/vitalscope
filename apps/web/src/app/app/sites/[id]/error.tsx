"use client";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-vz-border bg-vz-surface p-6">
      <h2 className="text-lg font-semibold text-vz-ink">Could not load this view</h2>
      <p className="mt-1 text-sm text-vz-ink-2">Something went wrong while loading your data. Try again in a moment.</p>
      {/* The real message is only shown while developing; production shows a generic error. */}
      {process.env.NODE_ENV !== "production" && (
        <pre className="mt-3 overflow-x-auto rounded-md bg-vz-page p-3 text-xs text-vz-ink-2">{error.message}</pre>
      )}
      <button onClick={reset} className="mt-4 rounded-md bg-vz-ink px-3 py-1.5 text-sm text-vz-surface">
        Try again
      </button>
    </div>
  );
}
