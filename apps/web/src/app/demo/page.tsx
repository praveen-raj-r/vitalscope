import { DemoUnavailable } from "@/components/demo-unavailable";
import { OverviewView } from "@/components/views/overview-view";
import { demoSiteId } from "@/lib/demo";
import { parseFilters } from "@/lib/filters";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DemoOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const siteId = demoSiteId();
  if (!siteId) return <DemoUnavailable />;

  return (
    <OverviewView
      // Server-only client that bypasses row-level security. Safe here only because it is used with the
      // demo site's fixed id and no site id ever comes from the URL.
      db={createAdminClient()}
      siteId={siteId}
      filters={parseFilters(await searchParams)}
      empty={
        <p className="rounded-lg border border-vz-border bg-vz-surface p-6 text-sm text-vz-ink-2">
          The demo site has no data in this period. Try a longer date range.
        </p>
      }
    />
  );
}
