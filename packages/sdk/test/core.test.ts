import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Metric } from "web-vitals";

const handlers: Record<string, (m: Metric) => void> = {};
vi.mock("web-vitals", () => {
  const reg = (name: string) => (cb: (m: Metric) => void) => {
    handlers[name] = cb;
  };
  return { onLCP: reg("LCP"), onINP: reg("INP"), onCLS: reg("CLS"), onFCP: reg("FCP"), onTTFB: reg("TTFB") };
});

import { start } from "../src/core";

const metric = (name: Metric["name"], value: number): Metric =>
  ({ name, value, rating: "good", delta: value, id: name, navigationType: "navigate", entries: [] }) as Metric;

function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

let sendBeacon: ReturnType<typeof vi.fn>;
let stop: () => void;

beforeEach(() => {
  sendBeacon = vi.fn(() => true);
  vi.stubGlobal("navigator", { sendBeacon });
  setVisibility("visible");
});
afterEach(() => {
  stop?.();
  vi.unstubAllGlobals();
  for (const k of Object.keys(handlers)) delete handlers[k];
});

describe("start", () => {
  it("queues metrics and sends exactly one beacon when the page becomes hidden", () => {
    stop = start({ siteKey: "vs_pub_x", release: "1.0.0", routePattern: () => "/p/:id" }, "https://x/ingest");
    handlers.LCP!(metric("LCP", 2100));
    handlers.CLS!(metric("CLS", 0.05));
    expect(sendBeacon).not.toHaveBeenCalled();
    setVisibility("hidden");
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = sendBeacon.mock.calls[0]!;
    expect(url).toBe("https://x/ingest");
    const payload = JSON.parse(body as string);
    expect(payload.siteKey).toBe("vs_pub_x");
    expect(payload.reports).toHaveLength(2);
    const lcp = payload.reports.find((r: { metric: string }) => r.metric === "LCP");
    expect(lcp).toMatchObject({ value: 2100, rating: "good", path: "/p/:id", release: "1.0.0" });
    expect(lcp.pageViewId).toBeTruthy();
    expect(payload.reports[0].pageViewId).toBe(payload.reports[1].pageViewId);
  });

  it("does not send when nothing was collected, and flushes again for later reports", () => {
    stop = start({ siteKey: "k" }, "u");
    setVisibility("hidden");
    expect(sendBeacon).not.toHaveBeenCalled();
    handlers.INP!(metric("INP", 150));
    window.dispatchEvent(new Event("pagehide"));
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it("does not flush while visible", () => {
    stop = start({ siteKey: "k" }, "u");
    handlers.LCP!(metric("LCP", 1));
    setVisibility("visible");
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("sampling is all-out: nothing is registered or sent", () => {
    stop = start({ siteKey: "k", sampleRate: 0 }, "u");
    expect(handlers.LCP).toBeUndefined();
    setVisibility("hidden");
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("a throwing routePattern does not break reporting", () => {
    stop = start(
      {
        siteKey: "k",
        routePattern: () => {
          throw new Error("x");
        },
      },
      "u",
    );
    handlers.LCP!(metric("LCP", 1));
    setVisibility("hidden");
    expect(JSON.parse(sendBeacon.mock.calls[0]![1] as string).reports[0].path).toBe("/");
  });
});
