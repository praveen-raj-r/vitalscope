import { notFound } from "next/navigation";
import { PageDetailView } from "@/components/views/page-detail-view";
import { parseFilters } from "@/lib/filters";
import { decodePathId } from "@/lib/path-id";
import { createClient } from "@/lib/supabase/server";

export default async function PageDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; path: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, path: pathId } = await params;
  const path = decodePathId(pathId);
  if (!path) notFound();

  const supabase = await createClient();
  return (
    <PageDetailView
      db={supabase}
      siteId={id}
      basePath={`/app/sites/${id}`}
      path={path}
      filters={parseFilters(await searchParams)}
    />
  );
}
