-- Vitalscope initial schema (spec §6). RLS is enabled on every table.
-- Lives in its own `vitalscope` schema because the Supabase project is shared with other apps.
-- The schema must also be listed under Project Settings -> API -> Exposed schemas on hosted projects.

create schema if not exists vitalscope;
grant usage on schema vitalscope to authenticated, service_role;

create table vitalscope.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  -- Public key embedded in the SDK snippet. Not a secret; origin checks + rate limits protect ingest.
  site_key text not null unique
    default ('vs_pub_' || replace(gen_random_uuid()::text, '-', '')),
  allowed_origins text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index sites_owner_id_idx on vitalscope.sites (owner_id);

create table vitalscope.events (
  id bigserial primary key,
  site_id uuid not null references vitalscope.sites (id) on delete cascade,
  page_view_id text not null,
  metric text not null check (metric in ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')),
  value double precision not null,
  rating text not null check (rating in ('good', 'needs-improvement', 'poor')),
  path text not null,
  device text not null check (device in ('mobile', 'tablet', 'desktop')),
  connection text,
  release text,
  attribution jsonb,
  client_ts timestamptz,
  received_at timestamptz not null default now()
);
create index events_site_metric_received_idx on vitalscope.events (site_id, metric, received_at);
create index events_site_path_metric_idx on vitalscope.events (site_id, path, metric);

create table vitalscope.daily_rollups (
  site_id uuid not null references vitalscope.sites (id) on delete cascade,
  day date not null,
  metric text not null,
  path text not null,
  device text not null,
  release text not null default '',
  count integer not null,
  p75 double precision not null,
  good integer not null,
  ni integer not null,
  poor integer not null,
  primary key (site_id, day, metric, path, device, release)
);

alter table vitalscope.sites enable row level security;
alter table vitalscope.events enable row level security;
alter table vitalscope.daily_rollups enable row level security;

-- sites: owner has full access to their own rows.
create policy sites_select_own on vitalscope.sites
  for select to authenticated using (owner_id = (select auth.uid()));
create policy sites_insert_own on vitalscope.sites
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy sites_update_own on vitalscope.sites
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy sites_delete_own on vitalscope.sites
  for delete to authenticated using (owner_id = (select auth.uid()));

-- events / daily_rollups: read-only for the site owner. No insert/update/delete policy:
-- writes happen only through the service role (/api/ingest, cron), which bypasses RLS.
create policy events_select_own on vitalscope.events
  for select to authenticated
  using (exists (
    select 1 from vitalscope.sites s
    where s.id = events.site_id and s.owner_id = (select auth.uid())
  ));
create policy rollups_select_own on vitalscope.daily_rollups
  for select to authenticated
  using (exists (
    select 1 from vitalscope.sites s
    where s.id = daily_rollups.site_id and s.owner_id = (select auth.uid())
  ));

-- Grants. Custom schemas get no automatic grants, so they are explicit and minimal.
-- RLS above still decides which rows each user can touch. `anon` gets nothing.
grant select, insert, update, delete on vitalscope.sites to authenticated;
grant select on vitalscope.events, vitalscope.daily_rollups to authenticated;
grant all on all tables in schema vitalscope to service_role;
grant usage, select on all sequences in schema vitalscope to service_role;
