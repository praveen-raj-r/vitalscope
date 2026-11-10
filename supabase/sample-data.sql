-- Sample data for trying out the dashboard. NOT a migration and NOT part of seed.sql: run it by hand
-- (Supabase SQL editor, or `psql` against a local database).
--
-- What it does: creates a separate site called "Sample data" for the account whose email you set below,
-- and inserts about 560 synthetic page views (about 2,600 event rows) spread over the last 14 days.
-- Nothing touches your real sites, so real counts stay clean.
--
-- Shape of the data (all invented, none of it is real traffic):
--   * 5 paths; "/about" gets few views, so its numbers show up greyed out ("under 30 samples")
--   * mobile is slower than desktop; release 1.1.0 (last 7 days) is faster than 1.0.0 (days 8-14)
--   * values are log-normal, rated with the same thresholds the dashboard uses
--
-- Re-running replaces the previous sample site. To remove all sample data:
--   delete from vitalscope.sites where name = 'Sample data';      -- events are deleted with it (cascade)

do $$
declare
  v_email text := 'your-email@example.com';  -- <-- EDIT: the email you sign in with
  v_owner uuid;
  v_site uuid;
begin
  select id into v_owner from auth.users where email = v_email;
  if v_owner is null then
    raise exception 'No user with email %. Edit v_email at the top of this script.', v_email;
  end if;

  delete from vitalscope.sites where owner_id = v_owner and name = 'Sample data';

  insert into vitalscope.sites (owner_id, name, allowed_origins)
  values (v_owner, 'Sample data', array['https://sample.example'])
  returning id into v_site;

  insert into vitalscope.events
    (site_id, page_view_id, metric, value, rating, path, device, connection, release, attribution, client_ts, received_at)
  with draws as (
    -- 14 days x 40 page views. Every random number is drawn once per page view, here.
    select d, random() as r_path, random() as r_dev, random() as r_conn, random() as r_inp,
      sqrt(-2 * ln(1 - random())) * cos(2 * pi() * random()) as z_lcp,   -- standard normal draws
      sqrt(-2 * ln(1 - random())) * cos(2 * pi() * random()) as z_inp,
      sqrt(-2 * ln(1 - random())) * cos(2 * pi() * random()) as z_cls,
      sqrt(-2 * ln(1 - random())) * cos(2 * pi() * random()) as z_ttfb
    from generate_series(0, 13) as d, generate_series(1, 40) as n
  ), pv as (
    select
      gen_random_uuid()::text as page_view_id,
      least(now() - interval '1 minute',
            date_trunc('day', now()) - d * interval '1 day' + random() * interval '23 hours') as at,
      case when r_path < .40 then '/' when r_path < .60 then '/pricing' when r_path < .80 then '/blog/:id'
           when r_path < .95 then '/docs' else '/about' end as path,
      case when r_dev < .55 then 'mobile' when r_dev < .95 then 'desktop' else 'tablet' end as device,
      case when r_conn < .75 then '4g' when r_conn < .92 then '3g' else '2g' end as connection,
      case when d >= 7 then '1.0.0' else '1.1.0' end as release,
      r_inp < .7 as has_inp,
      z_lcp, z_inp, z_cls, z_ttfb
    from draws
  ), v as (
    select pv.*,
      round(least(60000,
        (case device when 'mobile' then 3200 when 'tablet' then 2400 else 1800 end)
        * (case path when '/' then 1.0 when '/pricing' then .9 when '/blog/:id' then 1.3 when '/docs' then .8 else .7 end)
        * (case when release = '1.1.0' then .85 else 1 end)
        * exp(.45 * z_lcp))::numeric, 1)::float8 as lcp,
      round(greatest(8, (case device when 'desktop' then 120 else 220 end) * exp(.6 * z_inp))::numeric, 1)::float8 as inp,
      round(least(2, (case device when 'desktop' then .025 else .04 end) * exp(1.0 * z_cls))::numeric, 4)::float8 as cls,
      round(((case device when 'desktop' then 120 else 250 end) * exp(.5 * z_ttfb))::numeric, 1)::float8 as ttfb
    from pv
  )
  select v_site, page_view_id, 'TTFB', ttfb,
         case when ttfb <= 800 then 'good' when ttfb <= 1800 then 'needs-improvement' else 'poor' end,
         path, device, connection, release, null::jsonb, at - interval '3 seconds', at
  from v
  union all
  select v_site, page_view_id, 'FCP', round((lcp * .55)::numeric, 1)::float8,
         case when lcp * .55 <= 1800 then 'good' when lcp * .55 <= 3000 then 'needs-improvement' else 'poor' end,
         path, device, connection, release, null::jsonb, at - interval '3 seconds', at
  from v
  union all
  select v_site, page_view_id, 'LCP', lcp,
         case when lcp <= 2500 then 'good' when lcp <= 4000 then 'needs-improvement' else 'poor' end,
         path, device, connection, release,
         jsonb_build_object('target', case path
           when '/' then 'main > section.hero > img'
           when '/pricing' then 'main > h1'
           when '/blog/:id' then 'article > img.cover'
           when '/docs' then 'main > h1'
           else 'main > p' end),
         at - interval '3 seconds', at
  from v
  union all
  select v_site, page_view_id, 'CLS', cls,
         case when cls <= .1 then 'good' when cls <= .25 then 'needs-improvement' else 'poor' end,
         path, device, connection, release,
         jsonb_build_object('target', (array['div#hero', 'img.banner', 'section.ads'])[1 + floor(random() * 3)::int]),
         at - interval '3 seconds', at
  from v
  union all
  select v_site, page_view_id, 'INP', inp,
         case when inp <= 200 then 'good' when inp <= 500 then 'needs-improvement' else 'poor' end,
         path, device, connection, release,
         jsonb_build_object(
           'target', (array['button#buy', 'a.nav-link', 'input#search', 'button.menu'])[1 + floor(random() * 4)::int],
           'eventType', (array['click', 'keydown', 'pointerup'])[1 + floor(random() * 3)::int]),
         at - interval '3 seconds', at
  from v
  where has_inp;

  raise notice 'Created site "Sample data" (%) with % events.',
    v_site, (select count(*) from vitalscope.events where site_id = v_site);
end
$$;
