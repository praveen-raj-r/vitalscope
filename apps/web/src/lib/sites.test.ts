import { describe, expect, it } from "vitest";
import { isDemoSite } from "./demo";
import { confirmationMatches, createSiteSchema, installSnippet, parseOrigins } from "./sites";

describe("parseOrigins", () => {
  it("normalises, dedupes and strips paths", () => {
    const r = parseOrigins("https://a.com/path\nhttps://a.com, http://localhost:3000");
    expect(r.origins).toEqual(["https://a.com", "http://localhost:3000"]);
    expect(r.invalid).toEqual([]);
  });
  it("reports invalid and non-http entries", () => {
    const r = parseOrigins("not a url\nftp://x.com\nhttps://ok.dev");
    expect(r.origins).toEqual(["https://ok.dev"]);
    expect(r.invalid).toEqual(["not a url", "ftp://x.com"]);
  });
  it("handles empty input", () => {
    expect(parseOrigins("  \n ")).toEqual({ origins: [], invalid: [] });
  });
});

describe("createSiteSchema", () => {
  it("rejects empty and over-long names", () => {
    expect(createSiteSchema.safeParse({ name: "  ", origins: "" }).success).toBe(false);
    expect(createSiteSchema.safeParse({ name: "x".repeat(101), origins: "" }).success).toBe(false);
    expect(createSiteSchema.safeParse({ name: "Blog", origins: "" }).success).toBe(true);
  });
});

describe("installSnippet", () => {
  it("embeds the key and endpoint", () => {
    const s = installSnippet("vs_pub_abc", "https://x.dev/api/ingest");
    expect(s).toContain("siteKey: 'vs_pub_abc'");
    expect(s).toContain("https://x.dev/api/ingest");
  });
});

describe("isUuid", () => {
  it("accepts UUIDs and rejects anything else", async () => {
    const { isUuid } = await import("./sites");
    expect(isUuid("30000000-0000-0000-0000-0000000000a1")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("30000000-0000-0000-0000-0000000000a1; drop table")).toBe(false);
  });
});

describe("demoSiteId", () => {
  it("accepts only a valid UUID, so a typo means the demo is off rather than reading something else", async () => {
    const { demoSiteId } = await import("./demo");
    expect(demoSiteId("f721123f-2c82-4476-a029-3bc71cf4d3d9")).toBe("f721123f-2c82-4476-a029-3bc71cf4d3d9");
    expect(demoSiteId("  f721123f-2c82-4476-a029-3bc71cf4d3d9  ")).toBe("f721123f-2c82-4476-a029-3bc71cf4d3d9");
    expect(demoSiteId(undefined)).toBeNull();
    expect(demoSiteId("")).toBeNull();
    expect(demoSiteId("Sample data")).toBeNull();
    expect(demoSiteId("f721123f-2c82-4476-a029-3bc71cf4d3d9,other")).toBeNull();
  });
});

describe("confirmationMatches", () => {
  it("needs the exact site name, ignoring surrounding spaces", () => {
    expect(confirmationMatches("scratch", "scratch")).toBe(true);
    expect(confirmationMatches("scratch", "  scratch  ")).toBe(true);
    expect(confirmationMatches("  scratch ", "scratch")).toBe(true);
  });
  it("rejects a different case, a partial name and an empty entry", () => {
    expect(confirmationMatches("scratch", "Scratch")).toBe(false);
    expect(confirmationMatches("scratch", "scra")).toBe(false);
    expect(confirmationMatches("scratch", "")).toBe(false);
    expect(confirmationMatches("scratch", "   ")).toBe(false);
  });
});

describe("isDemoSite", () => {
  const DEMO = "f721123f-2c82-4476-a029-3bc71cf4d3d9";
  it("is true only for the configured demo site, whatever the letter case", () => {
    expect(isDemoSite(DEMO, DEMO)).toBe(true);
    expect(isDemoSite(DEMO.toUpperCase(), DEMO)).toBe(true);
    expect(isDemoSite("00000000-0000-4000-8000-000000000000", DEMO)).toBe(false);
  });
  it("is false when the demo is not configured or misconfigured", () => {
    expect(isDemoSite(DEMO, undefined)).toBe(false);
    expect(isDemoSite(DEMO, "")).toBe(false);
    expect(isDemoSite(DEMO, "Sample data")).toBe(false);
  });
});
