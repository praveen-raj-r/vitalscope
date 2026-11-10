import { notFound } from "next/navigation";
import { DemoUnavailable } from "@/components/demo-unavailable";
import { PageDetailView } from "@/components/views/page-detail-view";
import { demoSiteId } from "@/lib/demo";
import { parseFilters } from "@/lib/filters";
import { decodePathId } from "@/lib/path-id";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DemoPageDetail({
  params,
  searchParams,
}: {
  params: Promise<{ path: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const siteId = demoSiteId();
  if (!siteId) return <DemoUnavailable />;

  const path = decodePathId((await params).path);
  if (!path) notFound();

  // Server-only client, used only with the demo site's fixed id. The path is just a filter within that site.
  return (
    <PageDetailView
      db={createAdminClient()}
      siteId={siteId}
      basePath="/demo"
      path={path}
      filters={parseFilters(await searchParams)}
    />
  );
}
