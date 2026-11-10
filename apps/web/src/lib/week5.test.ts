import { describe, expect, it } from "vitest";
import { changePercent, formatChange, isComparable, pickReleases, verdictFor } from "./compare";
import { buildHistogram, HISTOGRAM_BINS } from "./histogram";
import { decodePathId, encodePathId } from "./path-id";

describe("path id", () => {
  it.each(["/", "/blog/:id", "/caf%C3%A9", "/search?q", "/a b/ü/€", "/" + "a".repeat(150)])("round-trips %s", (path) => {
    const id = encodePathId(path);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/); // one URL-safe segment, no slash or percent
    expect(decodePathId(id)).toBe(path);
  });
  it("rejects garbage, empty and over-long ids", () => {
    expect(decodePathId("")).toBeNull();
    expect(decodePathId("not base64 !!")).toBeNull();
    expect(decodePathId("L2Jsb2c")).toBe("/blog"); // the canonical encoding of "/blog"
    expect(decodePathId("L2Jsb2d")).toBeNull(); // same bytes, different padding bits: decodes, but does not re-encode to itself
    expect(decodePathId(encodePathId("/" + "a".repeat(250)))).toBeNull();
  });
});

describe("buildHistogram", () => {
  it("fills empty buckets, adds one overflow bucket and keeps sample counts", () => {
    const bars = buildHistogram("LCP", [
      { bucket: 1, samples: 5 },
      { bucket: 13, samples: 2 },
    ]);
    expect(bars).toHaveLength(HISTOGRAM_BINS.LCP.buckets + 1);
    expect(bars[0]!.samples).toBe(5);
    expect(bars[1]!.samples).toBe(0);
    expect(bars[12]!.samples).toBe(2);
    expect(bars[12]!.range).toBe("6 s or more");
  });
  it("rates each bin by which side of the thresholds it is on (LCP: 2.5 s and 4 s)", () => {
    const bars = buildHistogram("LCP", []);
    expect(bars[4]!.rating).toBe("good"); // 2.0 - 2.5 s
    expect(bars[5]!.rating).toBe("needs-improvement"); // 2.5 - 3.0 s
    expect(bars[7]!.rating).toBe("needs-improvement"); // 3.5 - 4.0 s
    expect(bars[8]!.rating).toBe("poor"); // 4.0 - 4.5 s
    expect(bars[12]!.rating).toBe("poor");
  });
  it("INP and CLS bins also align to their thresholds", () => {
    const inp = buildHistogram("INP", []);
    expect([inp[1]!.rating, inp[2]!.rating, inp[4]!.rating, inp[5]!.rating]).toEqual([
      "good",
      "needs-improvement",
      "needs-improvement",
      "poor",
    ]);
    const cls = buildHistogram("CLS", []);
    expect([cls[1]!.rating, cls[2]!.rating, cls[4]!.rating, cls[5]!.rating]).toEqual([
      "good",
      "needs-improvement",
      "needs-improvement",
      "poor",
    ]);
  });
  it("labels bins with readable ranges despite floating point steps", () => {
    const cls = buildHistogram("CLS", []);
    expect(cls[3]!.label).toBe("0.15");
    expect(cls[3]!.range).toBe("0.15 to 0.2");
  });
});

describe("pickReleases", () => {
  const available = ["1.1.0", "1.0.0", "0.9.0"]; // newest first
  it("defaults to the latest release against the one before it", () => {
    expect(pickReleases({}, available)).toEqual({ a: "1.0.0", b: "1.1.0" });
  });
  it("honours valid choices and fills the other side with a default", () => {
    expect(pickReleases({ a: "0.9.0", b: "1.0.0" }, available)).toEqual({ a: "0.9.0", b: "1.0.0" });
    expect(pickReleases({ b: "1.0.0" }, available)).toEqual({ a: "1.1.0", b: "1.0.0" });
  });
  it("ignores unknown releases and copes with few releases", () => {
    expect(pickReleases({ a: "nope", b: "also-nope" }, available)).toEqual({ a: "1.0.0", b: "1.1.0" });
    expect(pickReleases({}, ["1.0.0"])).toEqual({ a: null, b: "1.0.0" });
    expect(pickReleases({}, [])).toEqual({ a: null, b: null });
  });
});

describe("change between releases", () => {
  it("computes relative change and handles missing or zero baselines", () => {
    expect(changePercent(3000, 2400)).toBeCloseTo(-20);
    expect(changePercent(200, 250)).toBeCloseTo(25);
    expect(changePercent(0, 5)).toBeNull();
    expect(changePercent(null, 5)).toBeNull();
    expect(changePercent(5, undefined)).toBeNull();
  });
  it("lower is better; tiny changes count as no change", () => {
    expect(verdictFor(-12)).toBe("better");
    expect(verdictFor(8)).toBe("worse");
    expect(verdictFor(0.4)).toBe("same");
    expect(verdictFor(null)).toBeNull();
  });
  it("formats with a real minus sign", () => {
    expect(formatChange(-12.34)).toBe("−12.3%");
    expect(formatChange(5)).toBe("+5.0%");
    expect(formatChange(0.01)).toBe("0.0%");
  });
  it("needs 30 samples on both sides to trust a change", () => {
    expect(isComparable(30, 30)).toBe(true);
    expect(isComparable(29, 500)).toBe(false);
  });
});
