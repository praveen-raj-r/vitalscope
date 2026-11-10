import { handleIngest } from "@/lib/ingest/handler";
import { createRateLimiter } from "@/lib/ingest/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 100 requests per 10 s per siteKey. Module scope, so it lives as long as this server instance.
const limiter = createRateLimiter({ capacity: 100, windowMs: 10_000 });

export async function POST(request: Request) {
  return handleIngest(request, {
    limiter,
    async findSite(siteKey) {
      const { data, error } = await createAdminClient()
        .from("sites")
        .select("id, allowed_origins")
        .eq("site_key", siteKey)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? { id: data.id, allowedOrigins: data.allowed_origins } : null;
    },
    async insertEvents(rows) {
      const { error } = await createAdminClient().from("events").insert(rows);
      if (error) throw new Error(error.message);
    },
  });
}
