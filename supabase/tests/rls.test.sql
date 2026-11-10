-- pgTAP: user A must not see or touch user B's sites/events. Run: npx supabase test db
begin;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.dev'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.dev');

insert into public.sites (id, owner_id, name) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'A site'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'B site');

insert into public.events (site_id, page_view_id, metric, value, rating, path, device) values
  ('10000000-0000-0000-0000-00000000000a', 'pv1', 'LCP', 1000, 'good', '/', 'desktop'),
  ('10000000-0000-0000-0000-00000000000b', 'pv2', 'LCP', 5000, 'poor', '/', 'mobile');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);

select is((select count(*)::int from public.sites), 1, 'A sees only own site');
select is((select name from public.sites), 'A site', 'A sees A site');
select is((select count(*)::int from public.events), 1, 'A sees only own events');

select throws_ok(
  $$insert into public.sites (owner_id, name) values ('00000000-0000-0000-0000-00000000000b', 'spoof')$$,
  '42501', null, 'A cannot create a site owned by B');
select throws_ok(
  $$insert into public.events (site_id, page_view_id, metric, value, rating, path, device)
    values ('10000000-0000-0000-0000-00000000000a', 'x', 'LCP', 1, 'good', '/', 'desktop')$$,
  '42501', null, 'A cannot insert events directly');

update public.sites set name = 'hacked' where id = '10000000-0000-0000-0000-00000000000b';
delete from public.sites where id = '10000000-0000-0000-0000-00000000000b';

reset role;
select is((select name from public.sites where id = '10000000-0000-0000-0000-00000000000b'), 'B site', 'A cannot update B site');
select is((select count(*)::int from public.sites), 2, 'A cannot delete B site');
select matches((select site_key from public.sites limit 1), '^vs_pub_[0-9a-f]{32}$', 'site_key has expected format');

select * from finish();
rollback;
