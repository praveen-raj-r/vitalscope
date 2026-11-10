import { DemoUnavailable } from "@/components/demo-unavailable";
import { PagesView } from "@/components/views/pages-view";
import { demoSiteId } from "@/lib/demo";
import { parseFilters } from "@/lib/filters";
import { parseSort } from "@/lib/pages-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DemoPagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const siteId = demoSiteId();
  if (!siteId) return <DemoUnavailable />;
  const sp = await searchParams;
  // Server-only client, used only with the demo site's fixed id (see the demo overview page).
  return <PagesView db={createAdminClient()} siteId={siteId} basePath="/demo" filters={parseFilters(sp)} sort={parseSort(sp)} />;
}
