import { describe, expect, it } from "vitest";
import { createSiteSchema, installSnippet, parseOrigins } from "./sites";

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
