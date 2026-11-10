import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("web-vitals", () => ({
  onLCP: vi.fn(),
  onINP: vi.fn(),
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("init", () => {
  it("never throws on bad input and stays silent without debug", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { init } = await import("../src/index");
    expect(() => init(undefined as never)).not.toThrow();
    expect(() => init({ siteKey: "" })).not.toThrow();
    expect(() => init({ siteKey: "k" })).not.toThrow(); // no endpoint yet
    expect(warn).not.toHaveBeenCalled();
  });
  it("warns only in debug mode", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { init } = await import("../src/index");
    init({ siteKey: "", debug: true });
    expect(warn).toHaveBeenCalledOnce();
  });
  it("starts only once", async () => {
    const wv = await import("web-vitals");
    const { init } = await import("../src/index");
    init({ siteKey: "k", endpoint: "https://x/i" });
    init({ siteKey: "k", endpoint: "https://x/i" });
    expect(wv.onLCP).toHaveBeenCalledTimes(1);
  });
  it("swallows errors thrown while starting", async () => {
    const wv = await import("web-vitals");
    vi.mocked(wv.onLCP).mockImplementation(() => {
      throw new Error("boom");
    });
    const { init } = await import("../src/index");
    expect(() => init({ siteKey: "k", endpoint: "https://x/i" })).not.toThrow();
  });
});
