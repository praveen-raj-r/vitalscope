import { DemoUnavailable } from "@/components/demo-unavailable";
import { ReleasesView } from "@/components/views/releases-view";
import { demoSiteId } from "@/lib/demo";
import { parseFilters } from "@/lib/filters";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DemoReleasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const siteId = demoSiteId();
  if (!siteId) return <DemoUnavailable />;
  const sp = await searchParams;
  // Server-only client, used only with the demo site's fixed id (see the demo overview page).
  return <ReleasesView db={createAdminClient()} siteId={siteId} filters={parseFilters(sp, 30)} searchParams={sp} />;
}
