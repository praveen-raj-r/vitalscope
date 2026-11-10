-- Dashboard queries (week 4). All functions are SECURITY INVOKER (the default), so they run as the
-- signed-in user and row-level security on vitalscope.events decides what is visible: a user who passes
-- someone else's site id simply gets no rows. No service-role key is involved.
--
-- Shared filter arguments: p_days (clamped to 1..90), p_device and p_release (null = no filter).
-- Days are bucketed in UTC. p75 uses percentile_cont(0.75), as in the spec.

create function vitalscope.site_overview(
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
    and e.received_at >= now() - make_interval(days => greatest(1, least(p_days, 90)))
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by e.metric
$$;

create function vitalscope.site_trend(
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
    and e.received_at >= now() - make_interval(days => greatest(1, least(p_days, 90)))
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by 1, 2
  order by 1, 2
$$;

-- One row per path with p75 and sample counts for the three headline metrics.
-- "views" counts distinct page views (a page view reports several metrics).
create function vitalscope.site_pages(
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
    and e.received_at >= now() - make_interval(days => greatest(1, least(p_days, 90)))
    and (p_device is null or e.device = p_device)
    and (p_release is null or e.release = p_release)
  group by e.path
  order by 2 desc
  limit 500
$$;

-- Release names for the filter dropdown.
create function vitalscope.site_releases(p_site_id uuid)
returns setof text
language sql
stable
set search_path = ''
as $$
  select distinct e.release
  from vitalscope.events e
  where e.site_id = p_site_id and e.release is not null
  order by 1
  limit 100
$$;

-- Only signed-in users (and the service role) may call them. By default Postgres lets PUBLIC execute functions.
revoke all on function vitalscope.site_overview(uuid, int, text, text) from public, anon;
revoke all on function vitalscope.site_trend(uuid, int, text, text) from public, anon;
revoke all on function vitalscope.site_pages(uuid, int, text, text) from public, anon;
revoke all on function vitalscope.site_releases(uuid) from public, anon;

grant execute on function vitalscope.site_overview(uuid, int, text, text) to authenticated, service_role;
grant execute on function vitalscope.site_trend(uuid, int, text, text) to authenticated, service_role;
grant execute on function vitalscope.site_pages(uuid, int, text, text) to authenticated, service_role;
grant execute on function vitalscope.site_releases(uuid) to authenticated, service_role;
