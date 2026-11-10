-- pgTAP: daily rollups, retention and the rollup-backed trend (week 5, part 2). Run: npx supabase test db
begin;
select plan(21);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'roll-a@test.dev'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'roll-b@test.dev');

insert into vitalscope.sites (id, owner_id, name) values
  ('50000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a3', 'A site'),
  ('50000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000b3', 'B site');

-- Noon UTC, 2 days ago (y2) and yesterday (y1); plus today, 40 days ago and 45 days ago.
-- y2: LCP 1000, 2000 on "/" (desktop, r1) and 3000, 4000 on "/x" (mobile, r2), and one CLS.
insert into vitalscope.events (site_id, page_view_id, metric, value, rating, path, device, release, received_at) values
  ('50000000-0000-0000-0000-0000000000a3', 'y2a', 'LCP', 1000, 'good',              '/',  'desktop', 'r1', (((now() at time zone 'utc')::date - 2)::timestamp + interval '12 hours') at time zone 'utc'),
  ('50000000-0000-0000-0000-0000000000a3', 'y2b', 'LCP', 2000, 'good',              '/',  'desktop', 'r1', (((now() at time zone 'utc')::date - 2)::timestamp + interval '12 hours') at time zone 'utc'),
  ('50000000-0000-0000-0000-0000000000a3', 'y2c', 'LCP', 3000, 'needs-improvement', '/x', 'mobile',  'r2', (((now() at time zone 'utc')::date - 2)::timestamp + interval '12 hours') at time zone 'utc'),
  ('50000000-0000-0000-0000-0000000000a3', 'y2d', 'LCP', 4000, 'needs-improvement', '/x', 'mobile',  'r2', (((now() at time zone 'utc')::date - 2)::timestamp + interval '12 hours') at time zone 'utc'),
  ('50000000-0000-0000-0000-0000000000a3', 'y2a', 'CLS', 0.05, 'good',              '/',  'desktop', 'r1', (((now() at time zone 'utc')::date - 2)::timestamp + interval '12 hours') at time zone 'utc'),
  -- y1
  ('50000000-0000-0000-0000-0000000000a3', 'y1a', 'LCP', 1500, 'good',              '/',  'desktop', 'r1', (((now() at time zone 'utc')::date - 1)::timestamp + interval '12 hours') at time zone 'utc'),
  ('50000000-0000-0000-0000-0000000000a3', 'y1b', 'LCP', 2500, 'good',              '/x', 'mobile',  'r2', (((now() at time zone 'utc')::date - 1)::timestamp + interval '12 hours') at time zone 'utc'),
  ('50000000-0000-0000-0000-0000000000a3', 'y1c', 'LCP', 9000, 'poor',              '/x', 'mobile',  'r2', (((now() at time zone 'utc')::date - 1)::timestamp + interval '12 hours') at time zone 'utc'),
  -- today (never rolled up, always read raw)
  ('50000000-0000-0000-0000-0000000000a3', 't1',  'LCP',  700, 'good',              '/',  'desktop', 'r1', now()),
  -- older than the retention window: d40 will be rolled up first, d45 will not
  ('50000000-0000-0000-0000-0000000000a3', 'd40', 'LCP',  800, 'good',              '/',  'desktop', 'r1', (((now() at time zone 'utc')::date - 40)::timestamp + interval '12 hours') at time zone 'utc'),
  ('50000000-0000-0000-0000-0000000000a3', 'd45', 'LCP',  900, 'good',              '/',  'desktop', 'r1', (((now() at time zone 'utc')::date - 45)::timestamp + interval '12 hours') at time zone 'utc'),
  -- site B
  ('50000000-0000-0000-0000-0000000000b3', 'by1', 'LCP', 5000, 'poor',              '/',  'desktop', 'rb', (((now() at time zone 'utc')::date - 1)::timestamp + interval '12 hours') at time zone 'utc');

-- 1. Before any rollup exists, the trend falls back to raw events, so no day is missing: y2, y1 and today.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true);
select is((select count(*)::int from vitalscope.site_trend('50000000-0000-0000-0000-0000000000a3', 7) where metric = 'LCP'),
          3, 'trend falls back to raw events for days without rollups');
reset role;

-- 2-8. Rolling up days.
select lives_ok($$select vitalscope.rollup_day((now() at time zone 'utc')::date - 2)$$, 'rollup_day rolls up 2 days ago');
select lives_ok($$select vitalscope.rollup_day((now() at time zone 'utc')::date - 1)$$, 'rollup_day rolls up yesterday');

select is((select count || '/' || p75 from vitalscope.daily_rollups
           where site_id = '50000000-0000-0000-0000-0000000000a3' and day = (now() at time zone 'utc')::date - 2 and metric = 'LCP'
             and path = '(all)' and device = '(all)' and release = '(all)'),
          '4/3250', 'the all-dimension row has the exact count and p75 (1000, 2000, 3000, 4000)');
select is((select count || '/' || p75 from vitalscope.daily_rollups
           where site_id = '50000000-0000-0000-0000-0000000000a3' and day = (now() at time zone 'utc')::date - 2 and metric = 'LCP'
             and path = '/x' and device = 'mobile' and release = 'r2'),
          '2/3750', 'a fully specified row has its own count and p75 (3000, 4000)');

select lives_ok($$select vitalscope.rollup_day((now() at time zone 'utc')::date - 2)$$, 'rollup_day can be run again for the same day');
-- LCP: 15 rows (1 + 7 subsets x 2 distinct values), CLS: 8 rows (1 + 7 subsets x 1 value).
select is((select count(*)::int from vitalscope.daily_rollups
           where site_id = '50000000-0000-0000-0000-0000000000a3' and day = (now() at time zone 'utc')::date - 2),
          23, 'running a day twice leaves the same rows (idempotent)');

select throws_ok($$select vitalscope.rollup_day((now() at time zone 'utc')::date)$$, 'P0001', null,
                 'rollup_day refuses today, which is not finished');

-- 9-12. The trend read from rollups equals the answer computed from raw events, with and without a filter.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true);

select is_empty($$
  (select day, metric, samples, p75 from vitalscope.site_trend('50000000-0000-0000-0000-0000000000a3', 7))
  except
  (select (received_at at time zone 'utc')::date, metric, count(*)::bigint, percentile_cont(0.75) within group (order by value)
   from vitalscope.events where site_id = '50000000-0000-0000-0000-0000000000a3' and received_at >= vitalscope.window_start(7) group by 1, 2)
$$, 'rollup trend has no row that differs from raw events');
select is_empty($$
  (select (received_at at time zone 'utc')::date, metric, count(*)::bigint, percentile_cont(0.75) within group (order by value)
   from vitalscope.events where site_id = '50000000-0000-0000-0000-0000000000a3' and received_at >= vitalscope.window_start(7) group by 1, 2)
  except
  (select day, metric, samples, p75 from vitalscope.site_trend('50000000-0000-0000-0000-0000000000a3', 7))
$$, 'rollup trend is missing no row that raw events have');
select is_empty($$
  (select day, metric, samples, p75 from vitalscope.site_trend('50000000-0000-0000-0000-0000000000a3', 7, 'mobile'))
  except
  (select (received_at at time zone 'utc')::date, metric, count(*)::bigint, percentile_cont(0.75) within group (order by value)
   from vitalscope.events where site_id = '50000000-0000-0000-0000-0000000000a3' and received_at >= vitalscope.window_start(7) and device = 'mobile' group by 1, 2)
$$, 'filtered rollup trend has no row that differs from raw events');
select is_empty($$
  (select (received_at at time zone 'utc')::date, metric, count(*)::bigint, percentile_cont(0.75) within group (order by value)
   from vitalscope.events where site_id = '50000000-0000-0000-0000-0000000000a3' and received_at >= vitalscope.window_start(7) and device = 'mobile' group by 1, 2)
  except
  (select day, metric, samples, p75 from vitalscope.site_trend('50000000-0000-0000-0000-0000000000a3', 7, 'mobile'))
$$, 'filtered rollup trend is missing no row that raw events have');

-- 13-14. Only the service role may run the write functions.
select throws_ok($$select vitalscope.rollup_day((now() at time zone 'utc')::date - 1)$$, '42501', null,
                 'a signed-in user cannot run rollup_day');
-- 15. Rollup rows are protected by row-level security like events.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b3', true);
select is((select count(*)::int from vitalscope.daily_rollups where site_id = '50000000-0000-0000-0000-0000000000a3'),
          0, 'user B cannot read A rollups');

set local role anon;
select throws_ok($$select vitalscope.apply_retention(30)$$, '42501', null, 'anon cannot run apply_retention');
reset role;

-- 16-21. Retention only deletes events from days that have been rolled up.
select lives_ok($$select vitalscope.rollup_day((now() at time zone 'utc')::date - 40)$$, 'rollup_day rolls up an old day');
select is((select vitalscope.apply_retention(30)), 1::bigint,
          'retention deletes the old event whose day has rollups');
select is((select count(*)::int from vitalscope.events
           where site_id = '50000000-0000-0000-0000-0000000000a3' and received_at < vitalscope.window_start(30)),
          1, 'an old event whose day was never rolled up is kept');
select is((select vitalscope.rollup_missing(60)), 1,
          'rollup_missing rolls up the old day that had events but no rollups');
select is((select vitalscope.apply_retention(30)), 1::bigint,
          'once rolled up, that day is deleted by retention too');
select ok((select count(*) from vitalscope.daily_rollups
           where site_id = '50000000-0000-0000-0000-0000000000a3' and day = (now() at time zone 'utc')::date - 40) > 0,
          'rollup rows survive after their raw events are deleted');

select * from finish();
rollback;
