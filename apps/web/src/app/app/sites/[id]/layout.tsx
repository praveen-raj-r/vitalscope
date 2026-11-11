import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteTabs } from "@/components/site-tabs";
import { isUuid } from "@/lib/sites";
import { createClient } from "@/lib/supabase/server";
import { FOCUS, MONO, SERIF } from "@/lib/ui";
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
  const { data: site } = await supabase
    .from("sites")
    .select("name, allowed_origins")
    .eq("id", id)
    .maybeSingle();
  if (!site) notFound();

  return (
    // The shell leaves more room above a page title than the site pages want, so pull this up.
    <div className="-mt-4 md:-mt-9">
      <Link
        href="/app"
        className={`inline-flex min-h-11 items-center text-sm text-vz-ink-2 no-underline hover:text-vz-ink ${FOCUS}`}
      >
        ← My sites
      </Link>
      <h1
        className={`${SERIF} mt-1 mb-1.5 text-[40px] leading-[1.1] font-normal tracking-[-0.02em] wrap-anywhere`}
      >
        {site.name}
      </h1>
      <p className={`${MONO} mb-5 text-[13px] wrap-anywhere text-vz-ink-2`}>
        {site.allowed_origins.join(", ")}
      </p>
      <SiteTabs basePath={`/app/sites/${id}`} />
      <div className="mt-6">{children}</div>
      <DeleteSite id={id} name={site.name} />
    </div>
  );
}
