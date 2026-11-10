-- Week 5, part 2: daily rollups, retention, and a trend that reads rollups.
--
-- A p75 cannot be combined across rows (the p75 of two paths' p75s is not the p75 of both), so a rollup row
-- per (path, device, release) alone could not answer "the p75 for the whole site on that day". Each day is
-- therefore rolled up with a CUBE: for every metric there is a row for each combination of path, device and
-- release where any of them can be "all", written as the value '(all)'. Every filter the dashboard offers then
-- has an exact pre-computed row. "No release reported" is stored as '' and is different from '(all)'.
-- Trade-off: up to 8 rows per group instead of 1, and a path literally named "(all)" would collide with the marker.

-- Rolls one past UTC day of raw events into daily_rollups. Safe to run again for the same day: the rows are
-- replaced, which is also how late updates (a CLS that changed after midnight) get picked up. Refuses today,
-- because today is still incomplete. Returns the number of rollup rows written.
create function vitalscope.rollup_day(p_day date)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_rows bigint;
begin
  if p_day >= (now() at time zone 'utc')::date then
    raise exception 'rollup_day: % is not a finished UTC day', p_day;
  end if;

  insert into vitalscope.daily_rollups (site_id, day, metric, path, device, release, count, p75, good, ni, poor)
  select
    ev.site_id,
    p_day,
    ev.metric,
    case when grouping(ev.path) = 1 then '(all)' else ev.path end,
    case when grouping(ev.device) = 1 then '(all)' else ev.device end,
    case when grouping(ev.release) = 1 then '(all)' else ev.release end,
    count(*)::int,
    percentile_cont(0.75) within group (order by ev.value),
    (count(*) filter (where ev.rating = 'good'))::int,
    (count(*) filter (where ev.rating = 'needs-improvement'))::int,
    (count(*) filter (where ev.rating = 'poor'))::int
  from (
    select e.site_id, e.metric, e.path, e.device, coalesce(e.release, '') as release, e.value, e.rating
    from vitalscope.events e
    where e.received_at >= (p_day::timestamp at time zone 'utc')
      and e.received_at <  ((p_day + 1)::timestamp at time zone 'utc')
  ) ev
  group by ev.site_id, ev.metric, cube(ev.path, ev.device, ev.release)
  on conflict (site_id, day, metric, path, device, release) do update
    set count = excluded.count,
        p75 = excluded.p75,
        good = excluded.good,
        ni = excluded.ni,
        poor = excluded.poor;

  get diagnostics v_rows = row_count;
  return v_rows;
end
$$;

-- Rolls up every finished day (within the last p_max_days) that has events but no rollup rows yet, for
-- example because a cron run was missed. Returns how many days were rolled up.
create function vitalscope.rollup_missing(p_max_days int default 35)
returns int
language plpgsql
set search_path = ''
as $$
declare
  v_day date;
  v_days int := 0;
begin
  for v_day in
    select distinct (e.received_at at time zone 'utc')::date
    from vitalscope.events e
    where e.received_at >= (((now() at time zone 'utc')::date - least(greatest(p_max_days, 1), 400))::timestamp at time zone 'utc')
      and (e.received_at at time zone 'utc')::date < (now() at time zone 'utc')::date
      and not exists (
        select 1 from vitalscope.daily_rollups r
        where r.site_id = e.site_id and r.day = (e.received_at at time zone 'utc')::date
      )
    order by 1
  loop
    perform vitalscope.rollup_day(v_day);
    v_days := v_days + 1;
  end loop;
  return v_days;
end
$$;

-- Deletes raw events older than the retention window (the last p_keep_days whole UTC days are kept, matching the
-- dashboard's longest range), but ONLY for site-days that already have rollup rows, so a day that was never
-- rolled up is kept rather than lost. Returns the number of events deleted.
create function vitalscope.apply_retention(p_keep_days int default 30)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_deleted bigint;
begin
  delete from vitalscope.events e
  where e.received_at < vitalscope.window_start(p_keep_days)
    and exists (
      select 1 from vitalscope.daily_rollups r
      where r.site_id = e.site_id and r.day = (e.received_at at time zone 'utc')::date
    );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end
$$;

-- These write and delete: only the service role (the cron route) may run them.
revoke all on function vitalscope.rollup_day(date) from public, anon, authenticated;
revoke all on function vitalscope.rollup_missing(int) from public, anon, authenticated;
revoke all on function vitalscope.apply_retention(int) from public, anon, authenticated;
grant execute on function vitalscope.rollup_day(date) to service_role;
grant execute on function vitalscope.rollup_missing(int) to service_role;
grant execute on function vitalscope.apply_retention(int) to service_role;

-- The trend now reads rollups for finished days and raw events for today, as the spec says. A finished day
-- that has no rollup rows yet (cron has not run) falls back to raw events, so the chart is never missing days
-- and the answer is the same either way. Same signature as before, so grants are kept.
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
  with bounds as (
    select vitalscope.window_start(p_days) as start_ts,
           (now() at time zone 'utc')::date as today
  ),
  rolled as (
    select r.day, r.metric, r.count::bigint as samples, r.p75
    from vitalscope.daily_rollups r, bounds b
    where r.site_id = p_site_id
      and r.day >= (b.start_ts at time zone 'utc')::date
      and r.day < b.today
      and r.path = '(all)'
      and r.device = coalesce(p_device, '(all)')
      and r.release = coalesce(p_release, '(all)')
  ),
  raw as (
    select
      (e.received_at at time zone 'utc')::date as day,
      e.metric,
      count(*)::bigint as samples,
      percentile_cont(0.75) within group (order by e.value) as p75
    from vitalscope.events e, bounds b
    where e.site_id = p_site_id
      and e.received_at >= b.start_ts
      and (p_device is null or e.device = p_device)
      and (p_release is null or e.release = p_release)
      and not exists (
        select 1 from vitalscope.daily_rollups r
        where r.site_id = p_site_id and r.day = (e.received_at at time zone 'utc')::date
      )
    group by 1, 2
  )
  select * from rolled
  union all
  select * from raw
  order by 1, 2
$$;
