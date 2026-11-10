import { InstallEmptyState } from "@/components/install-empty-state";
import { OverviewView } from "@/components/views/overview-view";
import { hasActiveFilters, parseFilters } from "@/lib/filters";
import { createClient } from "@/lib/supabase/server";

export default async function SiteOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const filters = parseFilters(await searchParams);
  const supabase = await createClient();
  const { data: site } = await supabase.from("sites").select("site_key").eq("id", id).single();
  const endpoint = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/ingest`;

  return (
    <OverviewView
      db={supabase}
      siteId={id}
      filters={filters}
      empty={<InstallEmptyState siteKey={site?.site_key ?? ""} endpoint={endpoint} filtered={hasActiveFilters(filters)} />}
    />
  );
}
