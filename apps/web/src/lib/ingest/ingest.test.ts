import { describe, expect, it, vi } from "vitest";
import { handleIngest, readBodyCapped, type IngestDeps } from "./handler";
import { createRateLimiter } from "./rate-limit";
import { MAX_BODY_BYTES, payloadSchema, toRows } from "./schema";

const ORIGIN = "https://shop.example";
const SITE = { id: "site-1", allowedOrigins: [ORIGIN] };

const report = (over: Record<string, unknown> = {}) => ({
  metric: "LCP",
  value: 2100,
  rating: "good",
  path: "/",
  device: "desktop",
  pageViewId: "pv-1",
  ts: 1_700_000_000_000,
  ...over,
});
const payload = (reports: unknown[] = [report()], siteKey = "vs_pub_x") => ({ siteKey, reports });

function deps(over: Partial<IngestDeps> = {}): IngestDeps & { insert: ReturnType<typeof vi.fn> } {
  const insert = vi.fn(async () => {});
  return {
    findSite: async (key) => (key === "vs_pub_x" ? SITE : null),
    saveEvents: insert,
    limiter: createRateLimiter({ capacity: 100, windowMs: 10_000 }),
    insert,
    ...over,
  };
}

function post(body: unknown, headers: Record<string, string> = { origin: ORIGIN }) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost/api/ingest", {
    method: "POST",
    body: text,
    headers: { "content-type": "text/plain;charset=UTF-8", ...headers },
  });
}

describe("payloadSchema (validation)", () => {
  it("accepts a valid payload including optional fields", () => {
    const ok = payloadSchema.safeParse(
      payload([report({ attribution: { target: "main > img", url: "https://cdn/x.jpg" }, connection: "4g", release: "1.0.0" })]),
    );
    expect(ok.success).toBe(true);
  });

  it.each([
    ["unknown metric", report({ metric: "FID" })],
    ["negative value", report({ value: -1 })],
    ["absurd timing value", report({ value: 10_000_000 })],
    ["CLS out of range", report({ metric: "CLS", value: 500 })],
    ["bad rating", report({ rating: "ok" })],
    ["bad device", report({ device: "watch" })],
    ["empty path", report({ path: "" })],
    ["path over 200 chars", report({ path: "/" + "a".repeat(200) })],
    ["attribution value over 200 chars", report({ attribution: { target: "x".repeat(201) } })],
    ["too many attribution keys", report({ attribution: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, "v"])) })],
    ["non-numeric value", report({ value: "fast" })],
    ["missing pageViewId", report({ pageViewId: undefined })],
  ])("rejects %s", (_name, bad) => {
    expect(payloadSchema.safeParse(payload([bad])).success).toBe(false);
  });

  it("rejects empty and oversized report lists and a missing siteKey", () => {
    expect(payloadSchema.safeParse(payload([])).success).toBe(false);
    expect(payloadSchema.safeParse(payload(Array.from({ length: 11 }, () => report()))).success).toBe(false);
    expect(payloadSchema.safeParse({ reports: [report()] }).success).toBe(false);
  });

  it("strips unknown fields so they are never stored", () => {
    const parsed = payloadSchema.parse(payload([report({ email: "a@b.c" })]));
    expect(parsed.reports[0]).not.toHaveProperty("email");
  });
});

describe("toRows", () => {
  it("maps fields, fills nulls and converts the client timestamp", () => {
    const parsed = payloadSchema.parse(payload([report()]));
    const [row] = toRows("site-1", parsed.reports);
    expect(row).toMatchObject({
      site_id: "site-1",
      page_view_id: "pv-1",
      metric: "LCP",
      connection: null,
      release: null,
      attribution: null,
      client_ts: "2023-11-14T22:13:20.000Z",
    });
  });
  it("keeps only the last report of a metric within one page view, but not across page views", () => {
    const parsed = payloadSchema.parse(
      payload([
        report({ metric: "CLS", value: 0.1 }),
        report({ metric: "CLS", value: 0.3 }),
        report({ metric: "CLS", value: 0.5, pageViewId: "pv-2" }),
        report({ metric: "LCP" }),
      ]),
    );
    const rows = toRows("s", parsed.reports);
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.metric === "CLS" && r.page_view_id === "pv-1")!.value).toBe(0.3);
    expect(rows.find((r) => r.metric === "CLS" && r.page_view_id === "pv-2")!.value).toBe(0.5);
  });
  it("turns an impossible client timestamp into null instead of failing", () => {
    const parsed = payloadSchema.parse(payload([report({ ts: 9e15 })]));
    expect(toRows("s", parsed.reports)[0]!.client_ts).toBeNull();
  });
});

describe("createRateLimiter", () => {
  it("allows a burst up to capacity then rejects with Retry-After", () => {
    let t = 0;
    const l = createRateLimiter({ capacity: 3, windowMs: 3000, now: () => t });
    expect([1, 2, 3].map(() => l.check("k").ok)).toEqual([true, true, true]);
    const blocked = l.check("k");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
  });
  it("refills over time", () => {
    let t = 0;
    const l = createRateLimiter({ capacity: 2, windowMs: 2000, now: () => t });
    l.check("k");
    l.check("k");
    expect(l.check("k").ok).toBe(false);
    t = 1000; // one token back
    expect(l.check("k").ok).toBe(true);
    expect(l.check("k").ok).toBe(false);
  });
  it("keeps keys independent and sweeps idle buckets", () => {
    let t = 0;
    const l = createRateLimiter({ capacity: 1, windowMs: 1000, now: () => t });
    expect(l.check("a").ok).toBe(true);
    expect(l.check("b").ok).toBe(true);
    expect(l.check("a").ok).toBe(false);
    for (let i = 0; i < 1100; i++) l.check(`k${i}`);
    t = 5000;
    l.check("fresh");
    expect(l.size).toBeLessThan(5);
  });
});

describe("readBodyCapped", () => {
  it("returns the text when within the cap and null when over it", async () => {
    expect(await readBodyCapped(post("hello"), 100)).toBe("hello");
    expect(await readBodyCapped(post("x".repeat(50)), 10)).toBeNull();
  });
  it("enforces the cap on a streamed body that has no content-length", async () => {
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode("x".repeat(8)));
        c.enqueue(new TextEncoder().encode("x".repeat(8)));
        c.close();
      },
    });
    const req = new Request("http://localhost/", { method: "POST", body: stream, duplex: "half" } as RequestInit);
    expect(await readBodyCapped(req, 10)).toBeNull();
  });
});

describe("handleIngest", () => {
  it("204: stores rows for the owning site and returns CORS for that origin only", async () => {
    const d = deps();
    const res = await handleIngest(post(payload([report(), report({ metric: "INP", value: 120 })])), d);
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(d.insert).toHaveBeenCalledTimes(1);
    const rows = d.insert.mock.calls[0]![0];
    expect(rows).toHaveLength(2);
    expect(rows[0].site_id).toBe("site-1");
  });

  it("413: body over 16 KB, nothing is looked up or stored", async () => {
    const d = deps();
    const findSite = vi.spyOn(d, "findSite");
    const res = await handleIngest(post("x".repeat(MAX_BODY_BYTES + 1)), d);
    expect(res.status).toBe(413);
    expect(findSite).not.toHaveBeenCalled();
    expect(d.insert).not.toHaveBeenCalled();
  });

  it("400: invalid JSON, non-object body and missing siteKey", async () => {
    expect((await handleIngest(post("{nope"), deps())).status).toBe(400);
    expect((await handleIngest(post("null"), deps())).status).toBe(400);
    expect((await handleIngest(post({ reports: [report()] }), deps())).status).toBe(400);
    expect((await handleIngest(post({ siteKey: 5, reports: [] }), deps())).status).toBe(400);
  });

  it("404: unknown siteKey", async () => {
    const d = deps();
    const res = await handleIngest(post(payload([report()], "vs_pub_nope")), d);
    expect(res.status).toBe(404);
    expect(d.insert).not.toHaveBeenCalled();
  });

  it("403: wrong or missing Origin, with no CORS header", async () => {
    for (const headers of [{ origin: "https://evil.example" }, {}] as Record<string, string>[]) {
      const d = deps();
      const res = await handleIngest(post(payload(), headers), d);
      expect(res.status).toBe(403);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
      expect(d.insert).not.toHaveBeenCalled();
    }
  });

  it("429: over the rate limit, with Retry-After", async () => {
    const d = deps({ limiter: createRateLimiter({ capacity: 1, windowMs: 10_000 }) });
    expect((await handleIngest(post(payload()), d)).status).toBe(204);
    const res = await handleIngest(post(payload()), d);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThanOrEqual(1);
    expect(d.insert).toHaveBeenCalledTimes(1);
  });

  it("does not rate limit unknown keys (no memory growth from random keys)", async () => {
    const d = deps();
    await handleIngest(post(payload([report()], "vs_pub_random")), d);
    expect(d.limiter.size).toBe(0);
  });

  it("400: invalid payload names the failing field", async () => {
    const d = deps();
    const res = await handleIngest(post(payload([report({ metric: "FID" })])), d);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("reports.0.metric");
    expect(d.insert).not.toHaveBeenCalled();
  });

  it("500: a failing site lookup or insert returns a generic error without details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const lookup = await handleIngest(post(payload()), deps({ findSite: async () => { throw new Error("secret db detail"); } }));
    expect(lookup.status).toBe(500);
    expect(JSON.stringify(await lookup.json())).not.toContain("secret");
    const insert = await handleIngest(post(payload()), deps({ saveEvents: async () => { throw new Error("secret db detail"); } }));
    expect(insert.status).toBe(500);
    expect(JSON.stringify(await insert.json())).not.toContain("secret");
  });

  it("passes the real error to onError (for error reporting) while the response stays generic", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    const boom = new Error("db down");
    const res = await handleIngest(post(payload()), deps({ saveEvents: async () => { throw boom; }, onError }));
    expect(res.status).toBe(500);
    expect(onError).toHaveBeenCalledWith(boom);

    const lookupBoom = new Error("lookup down");
    await handleIngest(post(payload()), deps({ findSite: async () => { throw lookupBoom; }, onError }));
    expect(onError).toHaveBeenCalledWith(lookupBoom);
  });

  it("does not call onError for ordinary rejections such as a bad origin or invalid payload", async () => {
    const onError = vi.fn();
    await handleIngest(post(payload(), { origin: "https://evil.example" }), deps({ onError }));
    await handleIngest(post(payload([report({ metric: "FID" })])), deps({ onError }));
    expect(onError).not.toHaveBeenCalled();
  });
});
