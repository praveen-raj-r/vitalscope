import { createHash, timingSafeEqual } from "node:crypto";

export interface CronDeps {
  /** Rolls up one finished UTC day (YYYY-MM-DD). Returns the number of rollup rows written. */
  rollupDay(day: string): Promise<number>;
  /** Rolls up finished days that have events but no rollups. Returns how many days it rolled up. */
  rollupMissing(): Promise<number>;
  /** Deletes raw events past the retention window, only for days that have rollups. Returns how many. */
  applyRetention(): Promise<number>;
}

export interface CronSummary {
  rolledUp: { day: string; rows: number }[];
  missingDaysRolledUp: number;
  eventsDeleted: number;
}

/** The UTC calendar day `offsetDays` from `now`, as YYYY-MM-DD. */
export function utcDay(now: Date, offsetDays: number): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays)).toISOString().slice(0, 10);
}

/**
 * Yesterday is rolled up, and so is the day before it again, because a metric such as CLS can still be
 * updated shortly after midnight; rolling a day up twice just replaces its rows. Then any day a missed run
 * left behind is rolled up. Retention comes LAST: if anything before it throws, nothing is deleted.
 */
export async function runDailyJob(deps: CronDeps, now: Date = new Date()): Promise<CronSummary> {
  const rolledUp: CronSummary["rolledUp"] = [];
  for (const offset of [-1, -2]) {
    const day = utcDay(now, offset);
    rolledUp.push({ day, rows: await deps.rollupDay(day) });
  }
  const missingDaysRolledUp = await deps.rollupMissing();
  const eventsDeleted = await deps.applyRetention();
  return { rolledUp, missingDaysRolledUp, eventsDeleted };
}

/** Constant-time check of `Authorization: Bearer <secret>`. Without a configured secret nothing is authorised. */
export function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  // Hashing first gives both sides the same length, which timingSafeEqual requires.
  const a = createHash("sha256").update(header).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** The cron endpoint, without framework imports so it can be tested with plain Request objects. */
export async function handleCron(
  request: Request,
  options: { secret: string | undefined; deps: CronDeps; now?: Date },
): Promise<Response> {
  if (!options.secret) return json(503, { error: "cron is not configured" });
  if (!isAuthorized(request.headers.get("authorization"), options.secret)) return json(401, { error: "unauthorized" });
  try {
    return json(200, await runDailyJob(options.deps, options.now));
  } catch (e) {
    console.error("[cron] daily job failed", e instanceof Error ? e.message : "unknown");
    return json(500, { error: "job failed" });
  }
}
