import { PagesView } from "@/components/views/pages-view";
import { parseFilters } from "@/lib/filters";
import { parseSort } from "@/lib/pages-table";
import { createClient } from "@/lib/supabase/server";

export default async function SitePagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  return <PagesView db={supabase} siteId={id} basePath={`/app/sites/${id}`} filters={parseFilters(sp)} sort={parseSort(sp)} />;
}
