import { describe, expect, it } from "vitest";
import { detectDevice } from "../src/device";
import { normalizePath } from "../src/path";
import { buildPayload, ReportQueue } from "../src/queue";
import { isSampled } from "../src/sampling";
import { clip, stripQuery } from "../src/util";
import type { Report } from "../src/types";

const report = (over: Partial<Report> = {}): Report => ({
  metric: "LCP", value: 1200, rating: "good", path: "/", device: "desktop",
  pageViewId: "pv", ts: 1, ...over,
});

describe("isSampled", () => {
  it("handles the edges", () => {
    expect(isSampled(1)).toBe(true);
    expect(isSampled(0)).toBe(false);
    expect(isSampled(-1)).toBe(false);
    expect(isSampled(5)).toBe(true);
    expect(isSampled(undefined)).toBe(true);
    expect(isSampled(Number.NaN)).toBe(true);
  });
  it("compares the random draw to the rate", () => {
    expect(isSampled(0.5, () => 0.49)).toBe(true);
    expect(isSampled(0.5, () => 0.5)).toBe(false);
  });
});

describe("detectDevice", () => {
  it("uses width when userAgentData is missing", () => {
    expect(detectDevice(400)).toBe("mobile");
    expect(detectDevice(800)).toBe("tablet");
    expect(detectDevice(1400)).toBe("desktop");
  });
  it("trusts userAgentData.mobile", () => {
    expect(detectDevice(400, true)).toBe("mobile");
    expect(detectDevice(900, true)).toBe("tablet");
    expect(detectDevice(400, false)).toBe("desktop");
  });
});

describe("normalizePath", () => {
  it("strips query and hash", () => {
    expect(normalizePath("/a/b?x=1#h")).toBe("/a/b");
  });
  it("applies routePattern", () => {
    expect(normalizePath("/b/123", (p) => p.replace(/\d+/, ":id"))).toBe("/b/:id");
  });
  it("ignores a throwing or non-string routePattern", () => {
    expect(normalizePath("/x", () => { throw new Error("boom"); })).toBe("/x");
    expect(normalizePath("/x", (() => 5) as unknown as (p: string) => string)).toBe("/x");
  });
  it("strips a query that routePattern adds back, and clips to 200", () => {
    expect(normalizePath("/x", (p) => p + "?q=1")).toBe("/x");
    expect(normalizePath("/" + "a".repeat(300)).length).toBe(200);
  });
});

describe("util", () => {
  it("clip and stripQuery", () => {
    expect(clip("a".repeat(250)).length).toBe(200);
    expect(stripQuery("https://x.dev/i.png?sig=secret#frag")).toBe("https://x.dev/i.png");
  });
});

describe("ReportQueue", () => {
  it("replaces an unsent report of the same metric", () => {
    const q = new ReportQueue();
    q.add(report({ metric: "CLS", value: 0.1 }));
    q.add(report({ metric: "CLS", value: 0.3 }));
    q.add(report({ metric: "LCP" }));
    expect(q.size).toBe(2);
    const body = JSON.parse(q.flush("k")!);
    expect(body.siteKey).toBe("k");
    expect(body.reports.find((r: Report) => r.metric === "CLS").value).toBe(0.3);
    expect(q.size).toBe(0);
  });
  it("returns null when empty", () => {
    expect(new ReportQueue().flush("k")).toBeNull();
  });
});

describe("buildPayload size cap", () => {
  it("never exceeds the cap and leaves the rest for the next flush", () => {
    const big = (m: Report["metric"]) => report({ metric: m, attribution: { target: "x".repeat(200) } });
    const reports = [big("LCP"), big("INP"), big("CLS")];
    const one = JSON.stringify({ siteKey: "k", reports: [reports[0]] }).length;
    const built = buildPayload("k", reports, one + 50)!;
    expect(built.taken).toBe(1);
    expect(new TextEncoder().encode(built.body).length).toBeLessThanOrEqual(one + 50);
  });
  it("drops a single report that can never fit", () => {
    expect(buildPayload("k", [report()], 10)).toBeNull();
  });
  it("counts bytes, not characters", () => {
    const r = report({ attribution: { target: "é".repeat(100) } });
    const chars = JSON.stringify({ siteKey: "k", reports: [r] }).length;
    expect(buildPayload("k", [r], chars + 1)).toBeNull(); // 100 extra bytes from é
  });
});
