import { createClient } from "@supabase/supabase-js";
import { DB_SCHEMA } from "./schema";

/**
 * Service-role client: bypasses RLS. Server only. It is used by /api/ingest (and later the cron job),
 * and must never be imported from a client component or exposed to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env vars are not set");
  return createClient(url, key, {
    db: { schema: DB_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
