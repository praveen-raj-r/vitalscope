-- "Last N days" is now N whole UTC days ending today, instead of a rolling N x 24 hours.
-- A rolling window starts partway through a day, so the first trend point was a partial day with fewer
-- samples (e.g. 27 instead of 40), which made it the noisiest point of every chart. Today is still partial,
-- as it must be: it only has the data collected so far.
--
-- Replaces the three window-based functions from 20261110180000_dashboard_stats_functions.sql with the same
-- signatures (create or replace keeps their grants) and adds one helper that both agree on.

-- Start of the window: 00:00 UTC, (N - 1) days before today. N is clamped to 1..90.
create function vitalscope.window_start(p_days int)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select (date_trunc('day', now() at time zone 'utc') - (greatest(1, least(p_days, 90)) - 1) * interval '1 day')
         at time zone 'utc'
$$;

revoke all on function vitalscope.window_start(int) from public, anon;
grant execute on function vitalscope.window_start(int) to authenticated, service_role;

create or replace function vitalscope.site_overview(
  p_site_id uuid,
  p_days int default 7,
  p_device text default null,
  p_release text default null
)
returns table (
  metric text,
  samples bigint,
  p75 double precision,
  good bigint,
  ni bigint,
  poor bigint
)
language sql
stable
set search_path = ''
as $$
  select
    e.metric,
    count(*)::bigint,
    percentile_cont(0.75) within group (order by e.value),
    count(*) filter (where e.rating = 'good')::bigint,
    count(*) filter (where e.rating = 'needs-improvement')::bigint,
    count(*) filter (where e.rating = 'poor')::bigint
  from vitalscope.events e
  where e.site_id = p_site_id
    and e.received_at >= vitalscope.window_start(p_days)
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by e.metric
$$;

create or replace function vitalscope.site_trend(
  p_site_id uuid,
  p_days int default 7,
  p_device text default null,
  p_release text default null
)
returns table (
  day date,
  metric text,
  samples bigint,
  p75 double precision
)
language sql
stable
set search_path = ''
as $$
  select
    (e.received_at at time zone 'utc')::date,
    e.metric,
    count(*)::bigint,
    percentile_cont(0.75) within group (order by e.value)
  from vitalscope.events e
  where e.site_id = p_site_id
    and e.received_at >= vitalscope.window_start(p_days)
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by 1, 2
  order by 1, 2
$$;

create or replace function vitalscope.site_pages(
  p_site_id uuid,
  p_days int default 7,
  p_device text default null,
  p_release text default null
)
returns table (
  path text,
  views bigint,
  lcp_n bigint,
  lcp_p75 double precision,
  inp_n bigint,
  inp_p75 double precision,
  cls_n bigint,
  cls_p75 double precision
)
language sql
stable
set search_path = ''
as $$
  select
    e.path,
    count(distinct e.page_view_id)::bigint,
    count(*) filter (where e.metric = 'LCP')::bigint,
    percentile_cont(0.75) within group (order by e.value) filter (where e.metric = 'LCP'),
    count(*) filter (where e.metric = 'INP')::bigint,
    percentile_cont(0.75) within group (order by e.value) filter (where e.metric = 'INP'),
    count(*) filter (where e.metric = 'CLS')::bigint,
    percentile_cont(0.75) within group (order by e.value) filter (where e.metric = 'CLS')
  from vitalscope.events e
  where e.site_id = p_site_id
    and e.received_at >= vitalscope.window_start(p_days)
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by e.path
  order by 2 desc
  limit 500
$$;
