import { handleCron } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Call a rollup/retention function and return its numeric result. */
async function call(name: string, args: Record<string, unknown> = {}): Promise<number> {
  const { data, error } = await createAdminClient().rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return Number(data ?? 0);
}

// Vercel Cron calls this with GET and sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request) {
  return handleCron(request, {
    secret: process.env.CRON_SECRET,
    deps: {
      rollupDay: (day) => call("rollup_day", { p_day: day }),
      rollupMissing: () => call("rollup_missing"),
      applyRetention: () => call("apply_retention"),
    },
  });
}
