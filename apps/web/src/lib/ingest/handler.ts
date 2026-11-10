import type { RateLimiter } from "./rate-limit";
import { MAX_BODY_BYTES, payloadSchema, toRows, type EventRow } from "./schema";

export interface SiteRecord {
  id: string;
  allowedOrigins: string[];
}

export interface IngestDeps {
  findSite(siteKey: string): Promise<SiteRecord | null>;
  /** Must throw if the insert fails. */
  insertEvents(rows: EventRow[]): Promise<void>;
  limiter: RateLimiter;
}

/** Read at most `max` bytes. Returns null as soon as the body is known to be larger. */
export async function readBodyCapped(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

function reply(status: number, error?: string, extra: Record<string, string> = {}): Response {
  const headers = { Vary: "Origin", ...extra };
  if (status === 204) return new Response(null, { status, headers });
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

/**
 * Order follows the spec: size -> parse -> site -> origin -> rate limit -> validate -> insert.
 * CORS headers are only sent once the Origin has been checked against the site's allowed origins.
 */
export async function handleIngest(request: Request, deps: IngestDeps): Promise<Response> {
  // sendBeacon sends text/plain, so the body is parsed as JSON manually.
  const text = await readBodyCapped(request, MAX_BODY_BYTES);
  if (text === null) return reply(413, "payload too large");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400, "invalid json");
  }
  const siteKey = (body as { siteKey?: unknown } | null)?.siteKey;
  if (typeof siteKey !== "string" || siteKey.length === 0 || siteKey.length > 100) {
    return reply(400, "siteKey required");
  }

  let site: SiteRecord | null;
  try {
    site = await deps.findSite(siteKey);
  } catch (e) {
    console.error("[ingest] site lookup failed", e instanceof Error ? e.message : "unknown");
    return reply(500, "server error");
  }
  if (!site) return reply(404, "unknown site");

  // A public key is not a secret, so the Origin check is what ties a key to its own website.
  // It stops other websites from using the key in a browser; it cannot stop a script that forges the header.
  const origin = request.headers.get("origin");
  if (!origin || !site.allowedOrigins.includes(origin)) return reply(403, "origin not allowed");
  const cors = { "Access-Control-Allow-Origin": origin };

  const limit = deps.limiter.check(siteKey);
  if (!limit.ok) return reply(429, "rate limited", { ...cors, "Retry-After": String(limit.retryAfterSec) });

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return reply(400, `invalid payload: ${issue?.path.join(".") ?? ""} ${issue?.message ?? ""}`.trim(), cors);
  }

  try {
    await deps.insertEvents(toRows(site.id, parsed.data.reports));
  } catch (e) {
    console.error("[ingest] insert failed", e instanceof Error ? e.message : "unknown");
    return reply(500, "server error", cors);
  }
  return reply(204, undefined, cors);
}
