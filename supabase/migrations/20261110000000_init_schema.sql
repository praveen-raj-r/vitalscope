-- Vitalscope initial schema (spec §6). RLS is enabled on every table.

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  -- Public key embedded in the SDK snippet. Not a secret; origin checks + rate limits protect ingest.
  site_key text not null unique
    default ('vs_pub_' || replace(gen_random_uuid()::text, '-', '')),
  allowed_origins text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index sites_owner_id_idx on public.sites (owner_id);

create table public.events (
  id bigserial primary key,
  site_id uuid not null references public.sites (id) on delete cascade,
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
create index events_site_metric_received_idx on public.events (site_id, metric, received_at);
create index events_site_path_metric_idx on public.events (site_id, path, metric);

create table public.daily_rollups (
  site_id uuid not null references public.sites (id) on delete cascade,
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

alter table public.sites enable row level security;
alter table public.events enable row level security;
alter table public.daily_rollups enable row level security;

-- sites: owner has full access to their own rows.
create policy sites_select_own on public.sites
  for select to authenticated using (owner_id = (select auth.uid()));
create policy sites_insert_own on public.sites
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy sites_update_own on public.sites
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy sites_delete_own on public.sites
  for delete to authenticated using (owner_id = (select auth.uid()));

-- events / daily_rollups: read-only for the site owner. No insert/update/delete policy:
-- writes happen only through the service role (/api/ingest, cron), which bypasses RLS.
create policy events_select_own on public.events
  for select to authenticated
  using (exists (
    select 1 from public.sites s
    where s.id = events.site_id and s.owner_id = (select auth.uid())
  ));
create policy rollups_select_own on public.daily_rollups
  for select to authenticated
  using (exists (
    select 1 from public.sites s
    where s.id = daily_rollups.site_id and s.owner_id = (select auth.uid())
  ));
