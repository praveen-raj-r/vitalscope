-- pgTAP: dashboard stats functions return correct p75 / counts, honour filters, and respect RLS.
-- Run: npx supabase test db
begin;
select plan(18);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stats-a@test.dev'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'stats-b@test.dev');

insert into vitalscope.sites (id, owner_id, name) values
  ('30000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'A site'),
  ('30000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'B site');

-- Site A: LCP 1000/2000 (desktop, r1), 3000/4000 (mobile, r2) on "/", 9000 on "/about" (mobile, r2),
-- one CLS on "/", and one LCP 10 days ago (outside a 7 day window). Site B has one event.
insert into vitalscope.events (site_id, page_view_id, metric, value, rating, path, device, release, received_at) values
  ('30000000-0000-0000-0000-0000000000a1', 'pv1', 'LCP', 1000, 'good',              '/',       'desktop', 'r1', now()),
  ('30000000-0000-0000-0000-0000000000a1', 'pv2', 'LCP', 2000, 'good',              '/',       'desktop', 'r1', now()),
  ('30000000-0000-0000-0000-0000000000a1', 'pv3', 'LCP', 3000, 'needs-improvement', '/',       'mobile',  'r2', now()),
  ('30000000-0000-0000-0000-0000000000a1', 'pv4', 'LCP', 4000, 'poor',              '/',       'mobile',  'r2', now()),
  ('30000000-0000-0000-0000-0000000000a1', 'pv1', 'CLS', 0.05, 'good',              '/',       'desktop', 'r1', now()),
  ('30000000-0000-0000-0000-0000000000a1', 'pv5', 'LCP', 9000, 'poor',              '/about',  'mobile',  'r2', now()),
  ('30000000-0000-0000-0000-0000000000a1', 'pv6', 'LCP', 5000, 'poor',              '/old',    'desktop', 'r1', now() - interval '10 days'),
  ('30000000-0000-0000-0000-0000000000b1', 'pvb', 'LCP', 7000, 'poor',              '/',       'desktop', null, now());

-- Window boundary: two INP events on path "/edge", exactly at the start of the 7 day window (counted) and one
-- second before it (not counted). They use their own metric and path, so the assertions below are unaffected.
insert into vitalscope.events (site_id, page_view_id, metric, value, rating, path, device, release, received_at) values
  ('30000000-0000-0000-0000-0000000000a1', 'pv-edge-in',  'INP', 100, 'good', '/edge', 'desktop', 'r1', vitalscope.window_start(7)),
  ('30000000-0000-0000-0000-0000000000a1', 'pv-edge-out', 'INP', 100, 'good', '/edge', 'desktop', 'r1', vitalscope.window_start(7) - interval '1 second');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

-- The window is whole UTC days: it starts at midnight UTC, between 6 and 7 days ago (today is partial).
select is((vitalscope.window_start(7) at time zone 'utc')::time, '00:00:00'::time,
          'the 7 day window starts at midnight UTC');
select ok(now() - vitalscope.window_start(7) >= interval '6 days' and now() - vitalscope.window_start(7) < interval '7 days',
          'the 7 day window covers today plus the 6 previous days');
select is((select samples::int from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7) where metric = 'INP'),
          1, 'an event exactly at the window start is counted, one second earlier is not');
select is((select samples::int from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 30) where metric = 'INP'),
          2, 'both boundary events fall inside a 30 day window');

-- Overview, 7 days, no filters: 5 LCP samples (1000,2000,3000,4000,9000); p75 is the 4th value.
select is((select samples::int from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7) where metric = 'LCP'),
          5, 'overview counts LCP samples inside the window');
select is((select p75 from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7) where metric = 'LCP'),
          4000::float8, 'overview p75 uses percentile_cont(0.75)');
select is((select good || '/' || ni || '/' || poor from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7) where metric = 'LCP'),
          '2/1/2', 'overview splits samples into good / needs-improvement / poor');
select is((select samples::int from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 30) where metric = 'LCP'),
          6, 'a 30 day window includes the older event');

-- Filters.
select is((select samples::int from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7, 'mobile') where metric = 'LCP'),
          3, 'device filter limits samples');
select is((select p75 from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7, 'mobile') where metric = 'LCP'),
          6500::float8, 'p75 is interpolated within the filtered set (3000, 4000, 9000)');
select is((select p75 from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7, null, 'r1') where metric = 'LCP'),
          1750::float8, 'release filter limits samples (1000, 2000)');

-- Pages: views counts distinct page views, not rows.
select is((select views::int from vitalscope.site_pages('30000000-0000-0000-0000-0000000000a1', 7) where path = '/'),
          4, 'pages counts distinct page views per path (pv1 reported LCP and CLS)');
select is((select lcp_p75 from vitalscope.site_pages('30000000-0000-0000-0000-0000000000a1', 7) where path = '/'),
          3250::float8, 'pages p75 for LCP on "/" (1000, 2000, 3000, 4000)');

-- Trend: everything in the window happened today, so one UTC day bucket.
select is((select count(*)::int from vitalscope.site_trend('30000000-0000-0000-0000-0000000000a1', 7) where metric = 'LCP'),
          1, 'trend buckets by UTC day');

-- Releases for the filter dropdown include older events.
select is((select array_agg(r order by r) from vitalscope.site_releases('30000000-0000-0000-0000-0000000000a1') r),
          array['r1', 'r2'], 'releases lists distinct non-null releases');

-- RLS: user A asking about B's site gets nothing, even though the rows exist.
select is((select count(*)::int from vitalscope.site_overview('30000000-0000-0000-0000-0000000000b1', 7)),
          0, 'user A cannot see B overview');
select is((select count(*)::int from vitalscope.site_pages('30000000-0000-0000-0000-0000000000b1', 7)),
          0, 'user A cannot see B pages');

-- Anonymous callers cannot execute the functions at all.
set local role anon;
select throws_ok(
  $$select * from vitalscope.site_overview('30000000-0000-0000-0000-0000000000a1', 7)$$,
  '42501', null, 'anon cannot execute site_overview');

reset role;
select * from finish();
rollback;
