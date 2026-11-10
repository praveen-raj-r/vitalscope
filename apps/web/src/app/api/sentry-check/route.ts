import { isAuthorized } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Throws on purpose so you can confirm that Sentry receives server errors. Protected by CRON_SECRET (the same bearer
 * token as the cron route), so nobody else can trigger it:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://<host>/api/sentry-check
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "not configured" }, { status: 503 });
  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  throw new Error("Sentry check: this error was thrown on purpose to test error reporting");
}
