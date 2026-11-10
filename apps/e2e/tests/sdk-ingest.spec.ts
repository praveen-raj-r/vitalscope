import { expect, test, type APIRequestContext } from "@playwright/test";

const STUB = "http://localhost:3100";
const DEMO_ORIGIN = "http://localhost:5173";
const SITE_KEY = "vs_pub_e2e";

type StoredEvent = {
  metric: string;
  value: number;
  rating: string;
  path: string;
  device: string;
  release: string | null;
  page_view_id: string;
  attribution: Record<string, string> | null;
};

async function storedEvents(request: APIRequestContext): Promise<StoredEvent[]> {
  const res = await request.get(`${STUB}/__events`);
  return res.json();
}

const validPayload = (siteKey = SITE_KEY) =>
  JSON.stringify({
    siteKey,
    reports: [
      { metric: "LCP", value: 1200, rating: "good", path: "/", device: "desktop", pageViewId: "pv-e2e", ts: Date.now() },
    ],
  });

test.beforeEach(async ({ request }) => {
  await request.delete(`${STUB}/__events`);
});

test("the demo page sends its Core Web Vitals when the visitor leaves", async ({ page, request }) => {
  const endpoint = encodeURIComponent(`${STUB}/api/ingest`);
  await page.goto(`/?siteKey=${SITE_KEY}&endpoint=${endpoint}&release=e2e-1`);
  await expect(page.locator("#status")).toContainText("SDK started");

  // A slow interaction (the page blocks for ~300 ms) so there is an INP with an element to blame.
  await page.click("#slow");
  // A layout shift, delayed by a second because browsers ignore shifts right after a click.
  await page.click("#shift");
  await expect(page.getByText("Inserted without reserved space")).toBeVisible();

  // Nothing is sent while the visitor is still on the page.
  expect(await storedEvents(request)).toEqual([]);

  // Leaving the page is what triggers the one beacon.
  await page.click("a.button");

  await expect.poll(async () => (await storedEvents(request)).length).toBeGreaterThan(0);
  const events = await storedEvents(request);
  const byMetric = Object.fromEntries(events.map((e) => [e.metric, e]));

  for (const metric of ["TTFB", "FCP", "LCP", "INP", "CLS"]) {
    expect(byMetric[metric], `${metric} was reported`).toBeDefined();
  }

  // One page view, with the context the SDK adds.
  expect(new Set(events.map((e) => e.page_view_id)).size).toBe(1);
  for (const e of events) {
    expect(e.path).toBe("/"); // no query string, even though the page URL had one
    expect(e.device).toBe("desktop");
    expect(e.release).toBe("e2e-1");
  }

  // The slow click is reported against the element that caused it.
  expect(byMetric.INP!.value).toBeGreaterThan(250);
  expect(byMetric.INP!.attribution?.target).toContain("#slow");
  // The delayed shift counts, and points at the element that moved.
  expect(byMetric.CLS!.value).toBeGreaterThan(0);
  expect(byMetric.CLS!.attribution?.target).toBeTruthy();
});

test("ingest accepts a valid payload from the site's own origin and answers with CORS for it", async ({ request }) => {
  const res = await request.post(`${STUB}/api/ingest`, {
    headers: { Origin: DEMO_ORIGIN, "Content-Type": "text/plain;charset=UTF-8" },
    data: validPayload(),
  });
  expect(res.status()).toBe(204);
  expect(res.headers()["access-control-allow-origin"]).toBe(DEMO_ORIGIN);
  expect(await storedEvents(request)).toHaveLength(1);
});

test("ingest rejects another website using the site key, and stores nothing", async ({ request }) => {
  const res = await request.post(`${STUB}/api/ingest`, {
    headers: { Origin: "https://evil.example", "Content-Type": "text/plain" },
    data: validPayload(),
  });
  expect(res.status()).toBe(403);
  expect(res.headers()["access-control-allow-origin"]).toBeUndefined();
  expect(await storedEvents(request)).toEqual([]);
});

test("ingest rejects an unknown site key, an invalid payload and an oversized body", async ({ request }) => {
  const headers = { Origin: DEMO_ORIGIN, "Content-Type": "text/plain" };

  expect((await request.post(`${STUB}/api/ingest`, { headers, data: validPayload("vs_pub_nope") })).status()).toBe(404);
  expect(
    (await request.post(`${STUB}/api/ingest`, { headers, data: JSON.stringify({ siteKey: SITE_KEY, reports: [{ metric: "FID" }] }) })).status(),
  ).toBe(400);
  expect((await request.post(`${STUB}/api/ingest`, { headers, data: "x".repeat(20 * 1024) })).status()).toBe(413);

  expect(await storedEvents(request)).toEqual([]);
});
