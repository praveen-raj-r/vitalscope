-- Week 5: queries for the page detail view and the release comparison.
-- Same rules as the week 4 functions: SECURITY INVOKER (row-level security decides what is visible),
-- the whole-UTC-day window from vitalscope.window_start, NULL device / release = no filter.

-- p75 and good / needs-improvement / poor counts per metric for ONE path.
create function vitalscope.site_path_overview(
  p_site_id uuid,
  p_path text,
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
    and e.path = p_path
    and e.received_at >= vitalscope.window_start(p_days)
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by e.metric
$$;

-- Histogram of one metric on one path. Buckets are equal-width over [p_lo, p_hi): bucket 1 is the lowest,
-- and bucket p_buckets + 1 collects everything at or above p_hi. Empty buckets are not returned.
create function vitalscope.site_path_histogram(
  p_site_id uuid,
  p_path text,
  p_metric text,
  p_lo double precision,
  p_hi double precision,
  p_buckets int,
  p_days int default 7,
  p_device text default null,
  p_release text default null
)
returns table (
  bucket int,
  samples bigint
)
language sql
stable
set search_path = ''
as $$
  select
    width_bucket(e.value, p_lo, p_hi, greatest(1, least(p_buckets, 100))),
    count(*)::bigint
  from vitalscope.events e
  where e.site_id = p_site_id
    and e.path = p_path
    and e.metric = p_metric
    and e.received_at >= vitalscope.window_start(p_days)
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by 1
  order by 1
$$;

-- Which element (LCP, CLS) or interaction target (INP) is behind the bad numbers on a path. Ranked by how many
-- samples were not "good", then by volume, so the biggest source of bad experiences comes first.
create function vitalscope.site_path_attribution(
  p_site_id uuid,
  p_path text,
  p_metric text,
  p_days int default 7,
  p_device text default null,
  p_release text default null
)
returns table (
  target text,
  samples bigint,
  p75 double precision,
  not_good bigint
)
language sql
stable
set search_path = ''
as $$
  select
    e.attribution ->> 'target',
    count(*)::bigint,
    percentile_cont(0.75) within group (order by e.value),
    count(*) filter (where e.rating <> 'good')::bigint
  from vitalscope.events e
  where e.site_id = p_site_id
    and e.path = p_path
    and e.metric = p_metric
    and e.attribution ->> 'target' is not null
    and e.received_at >= vitalscope.window_start(p_days)
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by 1
  order by 4 desc, 2 desc
  limit 10
$$;

-- Releases with their page-view count and when they were first / last seen, newest first.
-- The comparison page uses it to default to "latest vs the one before it".
create function vitalscope.site_release_summary(p_site_id uuid)
returns table (
  release text,
  views bigint,
  first_seen timestamptz,
  last_seen timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    e.release,
    count(distinct e.page_view_id)::bigint,
    min(e.received_at),
    max(e.received_at)
  from vitalscope.events e
  where e.site_id = p_site_id and e.release is not null
  group by e.release
  order by max(e.received_at) desc
  limit 50
$$;

revoke all on function vitalscope.site_path_overview(uuid, text, int, text, text) from public, anon;
revoke all on function vitalscope.site_path_histogram(uuid, text, text, double precision, double precision, int, int, text, text) from public, anon;
revoke all on function vitalscope.site_path_attribution(uuid, text, text, int, text, text) from public, anon;
revoke all on function vitalscope.site_release_summary(uuid) from public, anon;

grant execute on function vitalscope.site_path_overview(uuid, text, int, text, text) to authenticated, service_role;
grant execute on function vitalscope.site_path_histogram(uuid, text, text, double precision, double precision, int, int, text, text) to authenticated, service_role;
grant execute on function vitalscope.site_path_attribution(uuid, text, text, int, text, text) to authenticated, service_role;
grant execute on function vitalscope.site_release_summary(uuid) to authenticated, service_role;
