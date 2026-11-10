import { describe, expect, it } from "vitest";
import { filtersToParams, hasActiveFilters, parseFilters } from "./filters";
import { nextDir, parseSort, sortPages, type PageRow } from "./pages-table";
import { formatAxis, formatDay, formatValue, hasEnoughData, percent, rate } from "./vitals";

describe("rate (spec thresholds)", () => {
  it("LCP: good <= 2.5 s, needs improvement <= 4 s, else poor", () => {
    expect(rate("LCP", 2500)).toBe("good");
    expect(rate("LCP", 2501)).toBe("needs-improvement");
    expect(rate("LCP", 4000)).toBe("needs-improvement");
    expect(rate("LCP", 4001)).toBe("poor");
  });
  it("INP: 200 ms / 500 ms", () => {
    expect(rate("INP", 200)).toBe("good");
    expect(rate("INP", 304)).toBe("needs-improvement");
    expect(rate("INP", 608)).toBe("poor");
  });
  it("CLS: 0.1 / 0.25", () => {
    expect(rate("CLS", 0.1)).toBe("good");
    expect(rate("CLS", 0.22)).toBe("needs-improvement");
    expect(rate("CLS", 0.26)).toBe("poor");
  });
});

describe("formatting", () => {
  it("formats each metric in its own unit", () => {
    expect(formatValue("LCP", 2345)).toBe("2.35 s");
    expect(formatValue("LCP", 96)).toBe("0.10 s");
    expect(formatValue("INP", 304.4)).toBe("304 ms");
    expect(formatValue("CLS", 0.0224)).toBe("0.02");
  });
  it("uses compact axis labels", () => {
    expect(formatAxis("LCP", 2500)).toBe("2.5 s");
    expect(formatAxis("LCP", 2000)).toBe("2 s");
    expect(formatAxis("LCP", 90)).toBe("0.09 s");
    expect(formatAxis("INP", 200)).toBe("200 ms");
    expect(formatAxis("CLS", 0.1)).toBe("0.1");
  });
  it("formats a UTC day without shifting it by the local time zone", () => {
    expect(formatDay("2026-11-10")).toBe("Nov 10");
    expect(formatDay("2026-01-01")).toBe("Jan 1");
  });
  it("requires 30 samples and computes whole-number shares", () => {
    expect(hasEnoughData(29)).toBe(false);
    expect(hasEnoughData(30)).toBe(true);
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
  });
});

describe("parseFilters", () => {
  it("defaults to 7 days with no device or release", () => {
    expect(parseFilters({})).toEqual({ days: 7, device: null, release: null });
  });
  it("accepts valid values", () => {
    expect(parseFilters({ days: "30", device: "mobile", release: "1.2.0" })).toEqual({
      days: 30,
      device: "mobile",
      release: "1.2.0",
    });
  });
  it("ignores unexpected values and takes the first of repeated params", () => {
    expect(parseFilters({ days: "999", device: "watch", release: "x".repeat(101) })).toEqual({
      days: 7,
      device: null,
      release: null,
    });
    expect(parseFilters({ days: ["30", "7"], device: ["tablet"] }).days).toBe(30);
  });
});

describe("filtersToParams", () => {
  it("always writes days, drops empty device/release and keeps unrelated params", () => {
    const base = new URLSearchParams("sort=lcp&days=30&device=mobile");
    const out = filtersToParams({ days: 7, device: null, release: "r1" }, base);
    expect(out.toString()).toBe("sort=lcp&days=7&release=r1");
  });
  it("round-trips through parseFilters, including a page default that differs from 7", () => {
    const filters = { days: 7 as const, device: "tablet" as const, release: null };
    const params = Object.fromEntries(filtersToParams(filters));
    expect(parseFilters(params, 30)).toEqual(filters);
    expect(parseFilters({}, 30).days).toBe(30);
  });
  it("detects active filters", () => {
    expect(hasActiveFilters({ days: 30, device: null, release: null })).toBe(false);
    expect(hasActiveFilters({ days: 7, device: "mobile", release: null })).toBe(true);
  });
});

const row = (path: string, views: number, lcp: number | null, inp: number | null = null): PageRow => ({
  path,
  views,
  lcp_n: lcp === null ? 0 : views,
  lcp_p75: lcp,
  inp_n: inp === null ? 0 : views,
  inp_p75: inp,
  cls_n: 0,
  cls_p75: null,
});

describe("sortPages", () => {
  const rows = [row("/a", 10, 2000), row("/b", 5, 5000), row("/c", 8, null), row("/d", 20, 5000)];

  it("worst LCP first by default; ties broken by views; missing values last", () => {
    const { key, dir } = parseSort({});
    expect(sortPages(rows, key, dir).map((r) => r.path)).toEqual(["/d", "/b", "/a", "/c"]);
  });
  it("keeps missing values last when ascending too", () => {
    expect(sortPages(rows, "lcp", "asc").map((r) => r.path)).toEqual(["/a", "/d", "/b", "/c"]);
  });
  it("sorts by views and by path, without mutating the input", () => {
    const copy = [...rows];
    expect(sortPages(rows, "views", "desc").map((r) => r.path)).toEqual(["/d", "/a", "/c", "/b"]);
    expect(sortPages(rows, "path", "asc").map((r) => r.path)).toEqual(["/a", "/b", "/c", "/d"]);
    expect(rows).toEqual(copy);
  });
});

describe("parseSort / nextDir", () => {
  it("falls back for unknown input and defaults direction by column", () => {
    expect(parseSort({ sort: "nope" })).toEqual({ key: "lcp", dir: "desc" });
    expect(parseSort({ sort: "path" })).toEqual({ key: "path", dir: "asc" });
    expect(parseSort({ sort: "inp", dir: "asc" })).toEqual({ key: "inp", dir: "asc" });
  });
  it("toggles the active column and starts others at their natural direction", () => {
    expect(nextDir({ key: "lcp", dir: "desc" }, "lcp")).toBe("asc");
    expect(nextDir({ key: "lcp", dir: "desc" }, "path")).toBe("asc");
    expect(nextDir({ key: "lcp", dir: "desc" }, "inp")).toBe("desc");
  });
});
