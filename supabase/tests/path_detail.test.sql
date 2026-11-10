-- pgTAP: page detail and release summary functions (week 5). Run: npx supabase test db
begin;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'path-a@test.dev'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'path-b@test.dev');

insert into vitalscope.sites (id, owner_id, name) values
  ('40000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a2', 'A site'),
  ('40000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2', 'B site');

-- Site A, path "/p", release r1, two days ago. LCP: 100 and 900 good, 2600 needs improvement (mobile), 7000 poor.
-- With 12 buckets over [0, 6000) each bucket is 500 wide: 100 -> 1, 900 -> 2, 2600 -> 6, 7000 -> 13 (overflow).
insert into vitalscope.events (site_id, page_view_id, metric, value, rating, path, device, release, attribution, received_at) values
  ('40000000-0000-0000-0000-0000000000a2', 'l1', 'LCP',  100, 'good',              '/p', 'desktop', 'r1', null, now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'l2', 'LCP',  900, 'good',              '/p', 'desktop', 'r1', null, now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'l3', 'LCP', 2600, 'needs-improvement', '/p', 'mobile',  'r1', null, now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'l4', 'LCP', 7000, 'poor',              '/p', 'desktop', 'r1', null, now() - interval '2 days'),
  -- A different path and a newer release, to prove path scoping and release ordering.
  ('40000000-0000-0000-0000-0000000000a2', 'o1', 'LCP', 1000, 'good',              '/other', 'desktop', 'r2', null, now()),
  -- INP on "/p": button#a is hit 3 times (2 not good), a.b twice (1 not good), one sample has no target.
  ('40000000-0000-0000-0000-0000000000a2', 'i1', 'INP', 600, 'poor', '/p', 'desktop', 'r1', '{"target":"button#a"}', now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'i2', 'INP', 600, 'poor', '/p', 'desktop', 'r1', '{"target":"button#a"}', now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'i3', 'INP', 100, 'good', '/p', 'desktop', 'r1', '{"target":"button#a"}', now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'i4', 'INP', 600, 'poor', '/p', 'desktop', 'r1', '{"target":"a.b"}',      now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'i5', 'INP', 100, 'good', '/p', 'desktop', 'r1', '{"target":"a.b"}',      now() - interval '2 days'),
  ('40000000-0000-0000-0000-0000000000a2', 'i6', 'INP', 100, 'good', '/p', 'desktop', 'r1', null,                    now() - interval '2 days'),
  -- Site B has data on the same path.
  ('40000000-0000-0000-0000-0000000000b2', 'bl1', 'LCP', 5000, 'poor', '/p', 'desktop', 'rb', '{"target":"img"}', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);

-- Path overview: only "/p" counts.
select is((select samples::int from vitalscope.site_path_overview('40000000-0000-0000-0000-0000000000a2', '/p', 7) where metric = 'LCP'),
          4, 'path overview counts only the requested path');
select is((select good || '/' || ni || '/' || poor from vitalscope.site_path_overview('40000000-0000-0000-0000-0000000000a2', '/p', 7) where metric = 'LCP'),
          '2/1/1', 'path overview splits samples by rating');
select is((select samples::int from vitalscope.site_path_overview('40000000-0000-0000-0000-0000000000a2', '/p', 7, 'mobile') where metric = 'LCP'),
          1, 'path overview honours the device filter');

-- Histogram.
select is((select samples::int from vitalscope.site_path_histogram('40000000-0000-0000-0000-0000000000a2', '/p', 'LCP', 0, 6000, 12, 7) where bucket = 1),
          1, 'histogram: 100 ms lands in bucket 1');
select is((select samples::int from vitalscope.site_path_histogram('40000000-0000-0000-0000-0000000000a2', '/p', 'LCP', 0, 6000, 12, 7) where bucket = 6),
          1, 'histogram: 2600 ms lands in bucket 6 (2500 to 3000)');
select is((select samples::int from vitalscope.site_path_histogram('40000000-0000-0000-0000-0000000000a2', '/p', 'LCP', 0, 6000, 12, 7) where bucket = 13),
          1, 'histogram: values at or above the upper bound go to the overflow bucket');
select is((select count(*)::int from vitalscope.site_path_histogram('40000000-0000-0000-0000-0000000000a2', '/p', 'LCP', 0, 6000, 12, 7)),
          4, 'histogram returns only non-empty buckets');

-- Attribution: ranked by not-good samples; samples without a target are ignored.
select is((select target from vitalscope.site_path_attribution('40000000-0000-0000-0000-0000000000a2', '/p', 'INP', 7) limit 1),
          'button#a', 'attribution ranks the target behind the most not-good samples first');
select is((select samples || '/' || not_good from vitalscope.site_path_attribution('40000000-0000-0000-0000-0000000000a2', '/p', 'INP', 7) limit 1),
          '3/2', 'attribution reports samples and not-good samples');
select is((select count(*)::int from vitalscope.site_path_attribution('40000000-0000-0000-0000-0000000000a2', '/p', 'INP', 7)),
          2, 'attribution ignores samples without a target');

-- Release summary: newest first, with distinct page views.
select is((select release from vitalscope.site_release_summary('40000000-0000-0000-0000-0000000000a2') limit 1),
          'r2', 'release summary lists the most recently seen release first');
select is((select views::int from vitalscope.site_release_summary('40000000-0000-0000-0000-0000000000a2') where release = 'r1'),
          10, 'release summary counts distinct page views');

-- RLS: user A cannot read site B through any of the functions.
select is((select count(*)::int from vitalscope.site_path_overview('40000000-0000-0000-0000-0000000000b2', '/p', 7))
        + (select count(*)::int from vitalscope.site_path_attribution('40000000-0000-0000-0000-0000000000b2', '/p', 'LCP', 7)),
          0, 'user A cannot see B path data');
select is((select count(*)::int from vitalscope.site_release_summary('40000000-0000-0000-0000-0000000000b2')),
          0, 'user A cannot see B releases');

-- Anonymous callers cannot execute the functions.
set local role anon;
select throws_ok(
  $$select * from vitalscope.site_path_overview('40000000-0000-0000-0000-0000000000a2', '/p', 7)$$,
  '42501', null, 'anon cannot execute site_path_overview');

reset role;
select * from finish();
rollback;
