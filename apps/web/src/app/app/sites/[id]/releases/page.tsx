import { ReleasesView } from "@/components/views/releases-view";
import { parseFilters } from "@/lib/filters";
import { createClient } from "@/lib/supabase/server";

export default async function ReleasesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  // Releases usually span more than a week, so this page defaults to 30 days.
  return <ReleasesView db={supabase} siteId={id} filters={parseFilters(sp, 30)} searchParams={sp} />;
}
