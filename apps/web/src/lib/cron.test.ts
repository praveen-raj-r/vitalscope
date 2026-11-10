import { describe, expect, it, vi } from "vitest";
import { handleCron, isAuthorized, runDailyJob, utcDay, type CronDeps } from "./cron";

const SECRET = "s3cret-value";
const NOW = new Date("2026-11-10T00:15:00Z");

function deps(over: Partial<CronDeps> = {}) {
  const calls: string[] = [];
  const d: CronDeps = {
    rollupDay: vi.fn(async (day: string) => {
      calls.push(`rollup:${day}`);
      return 23;
    }),
    rollupMissing: vi.fn(async () => {
      calls.push("missing");
      return 0;
    }),
    applyRetention: vi.fn(async () => {
      calls.push("retention");
      return 7;
    }),
    ...over,
  };
  return { d, calls };
}

const get = (headers: Record<string, string> = {}) => new Request("http://localhost/api/cron/daily", { headers });

describe("utcDay", () => {
  it("returns UTC calendar days, including across month and year ends", () => {
    expect(utcDay(NOW, -1)).toBe("2026-11-09");
    expect(utcDay(NOW, -2)).toBe("2026-11-08");
    expect(utcDay(new Date("2026-01-01T00:05:00Z"), -1)).toBe("2025-12-31");
    expect(utcDay(new Date("2026-03-01T00:05:00Z"), -1)).toBe("2026-02-28");
  });
  it("uses UTC even when the time of day is late", () => {
    expect(utcDay(new Date("2026-11-10T23:59:59Z"), 0)).toBe("2026-11-10");
  });
});

describe("runDailyJob", () => {
  it("rolls up yesterday and the day before, then missing days, and only then applies retention", async () => {
    const { d, calls } = deps();
    const summary = await runDailyJob(d, NOW);
    expect(calls).toEqual(["rollup:2026-11-09", "rollup:2026-11-08", "missing", "retention"]);
    expect(summary).toEqual({
      rolledUp: [
        { day: "2026-11-09", rows: 23 },
        { day: "2026-11-08", rows: 23 },
      ],
      missingDaysRolledUp: 0,
      eventsDeleted: 7,
    });
  });

  it("never applies retention if a rollup step fails", async () => {
    const { d } = deps({
      rollupDay: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    await expect(runDailyJob(d, NOW)).rejects.toThrow("boom");
    expect(d.applyRetention).not.toHaveBeenCalled();

    const second = deps({
      rollupMissing: vi.fn(async () => {
        throw new Error("missing failed");
      }),
    });
    await expect(runDailyJob(second.d, NOW)).rejects.toThrow("missing failed");
    expect(second.d.applyRetention).not.toHaveBeenCalled();
  });
});

describe("isAuthorized", () => {
  it("accepts exactly the bearer secret", () => {
    expect(isAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });
  it("rejects wrong, missing, malformed and differently-cased headers", () => {
    expect(isAuthorized("Bearer nope", SECRET)).toBe(false);
    expect(isAuthorized(SECRET, SECRET)).toBe(false);
    expect(isAuthorized(`bearer ${SECRET}`, SECRET)).toBe(false);
    expect(isAuthorized(null, SECRET)).toBe(false);
    expect(isAuthorized("", SECRET)).toBe(false);
  });
  it("authorises nothing when no secret is configured, even an empty bearer", () => {
    expect(isAuthorized("Bearer ", undefined)).toBe(false);
    expect(isAuthorized("Bearer ", "")).toBe(false);
  });
});

describe("handleCron", () => {
  it("503 when CRON_SECRET is not configured, and runs nothing", async () => {
    const { d, calls } = deps();
    const res = await handleCron(get({ authorization: "Bearer x" }), { secret: undefined, deps: d, now: NOW });
    expect(res.status).toBe(503);
    expect(calls).toEqual([]);
  });

  it("401 without or with a wrong token, and runs nothing", async () => {
    const { d, calls } = deps();
    expect((await handleCron(get(), { secret: SECRET, deps: d, now: NOW })).status).toBe(401);
    expect((await handleCron(get({ authorization: "Bearer wrong" }), { secret: SECRET, deps: d, now: NOW })).status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("200 with a summary for the right token", async () => {
    const { d } = deps();
    const res = await handleCron(get({ authorization: `Bearer ${SECRET}` }), { secret: SECRET, deps: d, now: NOW });
    expect(res.status).toBe(200);
    expect((await res.json()).eventsDeleted).toBe(7);
  });

  it("500 with a generic message when a step fails, without leaking details or deleting anything", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { d } = deps({
      rollupDay: vi.fn(async () => {
        throw new Error("rollup_day: relation vitalscope.daily_rollups does not exist");
      }),
    });
    const res = await handleCron(get({ authorization: `Bearer ${SECRET}` }), { secret: SECRET, deps: d, now: NOW });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("relation");
    expect(d.applyRetention).not.toHaveBeenCalled();
  });
});
