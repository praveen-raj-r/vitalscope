import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteTabs } from "@/components/site-tabs";
import { isUuid } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";
import { DeleteSite } from "./delete-site";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  // Row-level security returns nothing for a site that belongs to someone else, which is a 404 here too.
  const { data: site } = await supabase.from("sites").select("name, allowed_origins").eq("id", id).maybeSingle();
  if (!site) notFound();

  return (
    <div>
      <Link href="/app" className="text-sm text-vz-ink-2 underline hover:text-vz-ink">
        ← My sites
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{site.name}</h1>
      <p className="text-xs text-neutral-500">{site.allowed_origins.join(", ")}</p>
      <SiteTabs basePath={`/app/sites/${id}`} />
      <div className="mt-6">{children}</div>
      <DeleteSite id={id} name={site.name} />
    </div>
  );
}
