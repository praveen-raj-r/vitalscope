import { installSnippet } from "@/lib/sites";

export function InstallEmptyState({
  siteKey,
  endpoint,
  filtered,
}: {
  siteKey: string;
  endpoint: string;
  filtered: boolean;
}) {
  return (
    <section className="rounded-lg border border-vz-border bg-vz-surface p-6">
      <h2 className="text-lg font-semibold text-vz-ink">
        {filtered ? "No data for these filters" : "No data yet"}
      </h2>
      <p className="mt-1 text-sm text-vz-ink-2">
        {filtered
          ? "Try a longer date range, or set the device and release filters back to All."
          : "Install the SDK on your site. Numbers appear here after visitors load a page and then leave it."}
      </p>
      <pre className="mt-4 overflow-x-auto rounded-md bg-vz-page p-3 text-xs text-vz-ink">
        {installSnippet(siteKey, endpoint)}
      </pre>
    </section>
  );
}
