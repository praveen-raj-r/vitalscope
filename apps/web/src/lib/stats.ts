import type { createClient } from "./supabase/server";
import type { Filters } from "./filters";
import type { MetricKey } from "./vitals";
import type { PageRow } from "./pages-table";

type Supabase = Awaited<ReturnType<typeof createClient>>;

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
