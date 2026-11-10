import { z } from "zod";

export const MAX_BODY_BYTES = 16 * 1024;
const MAX_REPORTS = 10; // the SDK sends at most one report per metric (5)

// Upper bounds catch garbage without rejecting real slow pages: 10 minutes in ms, CLS is unitless.
const MAX_TIMING_MS = 600_000;
const MAX_CLS = 100;

const str = (max: number) => z.string().min(1).max(max);

export const reportSchema = z
  .object({
    metric: z.enum(["LCP", "INP", "CLS", "FCP", "TTFB"]),
    value: z.number().min(0).max(MAX_TIMING_MS),
    rating: z.enum(["good", "needs-improvement", "poor"]),
    attribution: z
      .record(z.string().max(50), z.string().max(200))
      .refine((a) => Object.keys(a).length <= 10, "too many attribution keys")
      .optional(),
    path: str(200),
    device: z.enum(["mobile", "tablet", "desktop"]),
    connection: str(20).optional(),
    release: str(100).optional(),
    pageViewId: str(64),
    ts: z.number().finite(),
  })
  .refine((r) => r.metric !== "CLS" || r.value <= MAX_CLS, { message: "CLS out of range", path: ["value"] });

export const payloadSchema = z.object({
  siteKey: str(100),
  reports: z.array(reportSchema).min(1).max(MAX_REPORTS),
});

export type Report = z.infer<typeof reportSchema>;

export interface EventRow {
  site_id: string;
  page_view_id: string;
  metric: Report["metric"];
  value: number;
  rating: Report["rating"];
  path: string;
  device: Report["device"];
  connection: string | null;
  release: string | null;
  attribution: Record<string, string> | null;
  client_ts: string | null;
}

/** Client clocks are untrusted: an out-of-range timestamp becomes null (received_at is the real time). */
function toIso(ts: number): string | null {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function toRows(siteId: string, reports: Report[]): EventRow[] {
  return reports.map((r) => ({
    site_id: siteId,
    page_view_id: r.pageViewId,
    metric: r.metric,
    value: r.value,
    rating: r.rating,
    path: r.path,
    device: r.device,
    connection: r.connection ?? null,
    release: r.release ?? null,
    attribution: r.attribution ?? null,
    client_ts: toIso(r.ts),
  }));
}
