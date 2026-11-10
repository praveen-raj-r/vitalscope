import { createClient } from "@/lib/supabase/server";
import { AddSiteForm } from "./add-site-form";

export default async function SitesPage() {
  const supabase = await createClient();
  // RLS limits this to the signed-in user's sites.
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, name, site_key, allowed_origins, created_at")
    .order("created_at", { ascending: false });

  const endpoint = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/ingest`;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold">My sites</h1>
        {error && <p role="alert" className="mt-2 text-red-600">Could not load sites.</p>}
        {!error && sites?.length === 0 && (
          <p className="mt-2 text-neutral-600">No sites yet. Add one below to get your install snippet.</p>
        )}
        <ul className="mt-4 space-y-2">
          {sites?.map((s) => (
            <li key={s.id} className="rounded border p-3">
              <div className="font-medium">{s.name}</div>
              <code className="text-xs text-neutral-600">{s.site_key}</code>
              <div className="text-xs text-neutral-500">{s.allowed_origins.join(", ")}</div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Add site</h2>
        <AddSiteForm endpoint={endpoint} />
      </section>
    </div>
  );
}
