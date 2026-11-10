import type { Filters } from "./filters";
import { HISTOGRAM_BINS } from "./histogram";
import type { MetricKey } from "./vitals";
import type { PageRow } from "./pages-table";

/**
 * All the dashboard queries need from a Supabase client is to call a database function. Typing it this way lets the
 * signed-in dashboard pass the user's client (row-level security applies) and the public demo pass a server-only
 * client that is only ever used with the demo site's fixed id.
 */
export interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

type Supabase = RpcClient;

export interface OverviewRow {
  metric: string;
  samples: number;
  p75: number;
  good: number;
  ni: number;
  poor: number;
}

export interface TrendRow {
  day: string; // YYYY-MM-DD, UTC
  metric: string;
  samples: number;
  p75: number;
}

function args(siteId: string, filters: Filters) {
  return { p_site_id: siteId, p_days: filters.days, p_device: filters.device, p_release: filters.release };
}

// There are no generated database types yet, so rpc results are untyped; each cast below states the
// shape the SQL function in supabase/migrations/20261110180000_dashboard_stats_functions.sql returns.
// The functions run as the signed-in user, so row-level security limits them to their own sites.

export async function fetchOverview(supabase: Supabase, siteId: string, filters: Filters): Promise<OverviewRow[]> {
  const { data, error } = await supabase.rpc("site_overview", args(siteId, filters));
  if (error) throw new Error(error.message);
  return (data ?? []) as OverviewRow[];
}

export async function fetchTrend(supabase: Supabase, siteId: string, filters: Filters): Promise<TrendRow[]> {
  const { data, error } = await supabase.rpc("site_trend", args(siteId, filters));
  if (error) throw new Error(error.message);
  return (data ?? []) as TrendRow[];
}

export async function fetchPages(supabase: Supabase, siteId: string, filters: Filters): Promise<PageRow[]> {
  const { data, error } = await supabase.rpc("site_pages", args(siteId, filters));
  if (error) throw new Error(error.message);
  return (data ?? []) as PageRow[];
}

export async function fetchReleases(supabase: Supabase, siteId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("site_releases", { p_site_id: siteId });
  if (error) throw new Error(error.message);
  return (data ?? []) as string[];
}

export function overviewFor(rows: readonly OverviewRow[], metric: MetricKey): OverviewRow | undefined {
  return rows.find((r) => r.metric === metric);
}

export function trendFor(rows: readonly TrendRow[], metric: MetricKey): TrendRow[] {
  return rows.filter((r) => r.metric === metric);
}

export interface HistogramRow {
  bucket: number;
  samples: number;
}

export interface AttributionRow {
  target: string;
  samples: number;
  p75: number;
  not_good: number;
}

export interface ReleaseSummaryRow {
  release: string;
  views: number;
  first_seen: string;
  last_seen: string;
}

export async function fetchPathOverview(
  supabase: Supabase,
  siteId: string,
  path: string,
  filters: Filters,
): Promise<OverviewRow[]> {
  const { data, error } = await supabase.rpc("site_path_overview", { ...args(siteId, filters), p_path: path });
  if (error) throw new Error(error.message);
  return (data ?? []) as OverviewRow[];
}

export async function fetchHistogram(
  supabase: Supabase,
  siteId: string,
  path: string,
  metric: MetricKey,
  filters: Filters,
): Promise<HistogramRow[]> {
  const bins = HISTOGRAM_BINS[metric];
  const { data, error } = await supabase.rpc("site_path_histogram", {
    ...args(siteId, filters),
    p_path: path,
    p_metric: metric,
    p_lo: bins.lo,
    p_hi: bins.hi,
    p_buckets: bins.buckets,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as HistogramRow[];
}

export async function fetchAttribution(
  supabase: Supabase,
  siteId: string,
  path: string,
  metric: MetricKey,
  filters: Filters,
): Promise<AttributionRow[]> {
  const { data, error } = await supabase.rpc("site_path_attribution", {
    ...args(siteId, filters),
    p_path: path,
    p_metric: metric,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as AttributionRow[];
}

export async function fetchReleaseSummary(supabase: Supabase, siteId: string): Promise<ReleaseSummaryRow[]> {
  const { data, error } = await supabase.rpc("site_release_summary", { p_site_id: siteId });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReleaseSummaryRow[];
}
