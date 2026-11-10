import { afterEach, describe, expect, it, vi } from "vitest";
import { send } from "../src/transport";

afterEach(() => vi.unstubAllGlobals());

describe("send", () => {
  it("uses sendBeacon when it accepts the payload", () => {
    const sendBeacon = vi.fn(() => true);
    const fetchMock = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("fetch", fetchMock);
    expect(send("https://x/ingest", "body")).toBe(true);
    expect(sendBeacon).toHaveBeenCalledWith("https://x/ingest", "body");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("falls back to fetch keepalive when sendBeacon returns false", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("navigator", { sendBeacon: () => false });
    vi.stubGlobal("fetch", fetchMock);
    send("https://x/ingest", "body");
    expect(fetchMock).toHaveBeenCalledWith("https://x/ingest", expect.objectContaining({ keepalive: true, method: "POST", body: "body" }));
  });
  it("falls back to fetch when sendBeacon is missing or throws", () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {});
    send("u", "b");
    vi.stubGlobal("navigator", { sendBeacon: () => { throw new Error("x"); } });
    send("u", "b");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("never throws, even if fetch rejects or throws", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("fetch", () => Promise.reject(new Error("net")));
    expect(() => send("u", "b")).not.toThrow();
    vi.stubGlobal("fetch", () => { throw new Error("sync"); });
    expect(send("u", "b")).toBe(false);
  });
});
