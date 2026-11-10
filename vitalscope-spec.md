# Vitalscope — Spec

> Working name. Rename freely (update package names and this file).
> Real-user monitoring (RUM) for Core Web Vitals: a tiny open-source SDK + a dashboard.
> Portfolio goal: show senior-level frontend performance skill, real usage data, tests and CI.

---

## 1. Problem and goal

Lighthouse measures one lab run on one machine. Real users have slow phones, bad networks and
different pages. Teams need to know **which pages are slow for real users, on which devices,
and whether the last release made it better or worse.**

Vitalscope answers three questions for a site owner:
1. What is the p75 LCP / INP / CLS for my site right now, and is it "good"?
2. Which pages, devices and elements cause the bad scores?
3. Did release `X` improve or regress performance compared with release `Y`?

**Success for this project (resume-relevant, measured, not guessed):**
- SDK published on npm, ≤ 5 KB gzip total (enforced in CI).
- Installed on at least 2 real sites (LiveBoard + the dashboard itself; more with permission).
- `[N]` real page views ingested — record the number from the DB, never estimate.

---

## 2. Scope

### In scope (MVP)
- `@vitalscope/sdk` — browser SDK (TypeScript, ESM + IIFE build).
- Ingest API — validates and stores beacons.
- Dashboard — sign in, create sites, view metrics.
- Tests, size budget, CI, public demo.

### Out of scope (do NOT build unless this spec is updated)
- Session replay, error tracking, logs, tracing.
- Alerts/notifications (stretch goal, week 6+ only).
- Team/org accounts, billing, multi-region.
- A custom chart library (use Recharts).

---

## 3. Architecture

```
vitalscope/                     pnpm workspace monorepo
├─ packages/sdk                 @vitalscope/sdk (published to npm)
├─ apps/web                     Next.js App Router: dashboard + /api/ingest
├─ apps/demo                    Small Vite page that loads the SDK (for e2e + demos)
└─ supabase/                    Supabase CLI project: migrations/, seed.sql, config.toml
```

- **Frontend:** Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui, Recharts, TanStack Query for client-side refetching where needed.
- **Backend:** Next.js route handlers on **Supabase** (Postgres). No ORM: typed `supabase-js` client with generated types (`supabase gen types`), SQL migrations via the Supabase CLI, and Postgres functions (called with `rpc`) for p75 and rollup queries.
- **Database project:** a **separate Supabase project** for Vitalscope (do not share LiveBoard's project), so RLS policies, quotas and data stay isolated.
- **Auth:** **Supabase Auth** with GitHub OAuth, using `@supabase/ssr` for cookie-based sessions in Next.js. Dashboard pages check the session on the server, and **Row-Level Security** makes sure a user can only read their own sites and events.
- **Keys:** the browser and dashboard use the anon key + the user's session (RLS applies). Only `/api/ingest` and the cron job use the **service-role key**, server-side only, never exposed to the browser.
- **Rate limiting:** Upstash Redis (free tier) token bucket per site key.
- **Hosting:** Vercel. Ingest route runs on the Node runtime.

### Data flow
1. Site loads SDK with a public `siteKey`.
2. SDK collects metrics using Google's `web-vitals` library (attribution build) and adds context.
3. SDK batches reports and sends them with `navigator.sendBeacon` on `visibilitychange` → hidden / `pagehide`; falls back to `fetch(..., { keepalive: true })`.
4. `/api/ingest` checks origin + rate limit, validates with Zod, inserts rows.
5. Dashboard queries Postgres for p75 and distributions.

---

## 4. SDK — `@vitalscope/sdk`

### Public API
```ts
import { init } from '@vitalscope/sdk';

init({
  siteKey: 'vs_pub_xxx',        // required, public
  endpoint: 'https://…/api/ingest', // optional, defaults to hosted
  sampleRate: 1,                // 0..1, decided once per page view
  release: '1.4.2',             // optional build/version tag
  routePattern: (path) => path, // optional: normalise /b/123 → /b/:id
  debug: false,
});
```
Also ship an IIFE build for a `<script>` tag.

### Collected per page view
| Field | Notes |
|---|---|
| metric | LCP, INP, CLS, FCP, TTFB |
| value, rating | from web-vitals (`good` / `needs-improvement` / `poor`) |
| attribution | LCP: element selector + resource URL; INP: target selector + event type; CLS: largest shift source. Trim strings to 200 chars |
| path | after `routePattern`; strip query string and hash |
| device | `mobile` / `tablet` / `desktop` from viewport width + `userAgentData.mobile` when available |
| connection | `navigator.connection.effectiveType` when available |
| release | from config |
| pageViewId | random id per page view (no cookies) |
| ts | client time; server also records `received_at` |

### Rules
- **No PII.** No cookies, no IPs stored, no user ids, no full URLs with query strings.
- **Size budget:** total ≤ 5 KB gzip including `web-vitals`. Enforced with `size-limit` in CI.
- **Never break the host page:** every public function wrapped in try/catch; no throws, no console noise unless `debug`.
- **Sampling** is decided once per page view so a page view is all-in or all-out.
- **Batching:** queue reports, flush on hidden/pagehide, max 1 beacon per flush, payload ≤ 16 KB.
- **SPA soft navigations:** MVP reports metrics against the path at report time. A React Router adapter is a stretch goal.

---

## 5. Ingest API — `POST /api/ingest`

1. Parse body (text/plain from sendBeacon is allowed; parse JSON manually). Reject bodies > 16 KB → 413.
2. Look up site by `siteKey`. Unknown → 404.
3. Check `Origin` against the site's `allowed_origins`. Mismatch → 403.
4. Rate limit per siteKey (e.g. 100 req / 10 s). Exceeded → 429.
5. Validate with Zod (metric enum, value ranges, string lengths). Invalid → 400.
6. Bulk insert rows. Return 204.
7. CORS: allow only the site's allowed origins.

---

## 6. Data model (PostgreSQL)

```
auth.users       managed by Supabase Auth
sites            id, owner_id → auth.users, name, site_key (unique, public),
                 allowed_origins text[], created_at
events           id bigserial, site_id → sites, page_view_id, metric, value double,
                 rating, path, device, connection, release, attribution jsonb,
                 client_ts, received_at
daily_rollups    site_id, day, metric, path, device, release,
                 count, p75, good, ni, poor        (PK on all dimension columns)
```
- Index `events (site_id, metric, received_at)` and `(site_id, path, metric)`.
- p75 with `percentile_cont(0.75) WITHIN GROUP (ORDER BY value)`.
- **Rollups (week 5):** a Vercel Cron job aggregates the previous day into `daily_rollups`; dashboards older than 1 day read rollups; today reads raw events.
- **Retention:** delete raw events older than 30 days (same cron).
- Commit every schema change as a migration file (`supabase migration new …`). Never change the DB in the dashboard without a migration.
- **RLS on every table.** `sites`: owner can select/insert/update/delete where `owner_id = auth.uid()`. `events` and `daily_rollups`: select only where the site belongs to `auth.uid()`; **no insert policy for users** — inserts happen only through `/api/ingest` with the service role.
- Test RLS: a SQL test (or Vitest against a local Supabase) proving user A cannot read user B's sites or events.
- Free-tier limits to respect: 500 MB database, so the 30-day retention job matters. Note in README how much space 1M events uses (measure it).

---

## 7. Dashboard

Routes (all `/app/*` require a server-checked session):
| Route | Content |
|---|---|
| `/` | Public landing page: what it is, install snippet, link to demo + GitHub |
| `/demo` | Read-only dashboard on seeded + real data, no login |
| `/app` | List of my sites, "Add site" (name + allowed origins → shows siteKey and snippet) |
| `/app/sites/[id]` | Overview: p75 cards for LCP/INP/CLS with good/NI/poor colour, trend chart (7/30 days), filters for device + release |
| `/app/sites/[id]/pages` | Table of paths: views, p75 per metric, sortable; worst pages first |
| `/app/sites/[id]/pages/[path]` | Distribution histogram + top attribution (which LCP element / INP target is slow) |
| `/app/sites/[id]/releases` | Compare two releases: p75 per metric, change %, sample size |
| `/app/sites/[id]/settings` | Allowed origins, rotate siteKey, delete site |

UX rules:
- Show **sample size** next to every number; grey out results with < 30 samples ("not enough data").
- Thresholds: LCP 2.5 s / 4 s, INP 200 ms / 500 ms, CLS 0.1 / 0.25.
- Loading skeletons, empty states with the install snippet, error states.
- Accessible: keyboard-navigable tables and filters, chart data also available as a table.

---

## 8. Testing and quality

- **SDK (Vitest + happy-dom):** sampling decision, batching and flush on `visibilitychange`, sendBeacon → fetch fallback, payload size cap, `routePattern`, never throws.
- **Ingest (Vitest):** Zod validation cases, origin check, rate-limit response, oversize body.
- **SQL:** test p75 / rollup queries against a seeded test DB (or pure functions that build them).
- **E2E (Playwright):** demo page loads SDK → navigate away → event appears in the dashboard.
- **CI (GitHub Actions):** install, lint, typecheck, unit tests, `size-limit`, build. E2E on main.
- **Monitoring:** Sentry on the dashboard app (free tier).
- TypeScript strict, no `any` without a comment explaining why.

---

## 9. Six-week plan

| Week | Deliverable |
|---|---|
| 1 | Monorepo, CI, Supabase project + local CLI setup, schema + RLS migration, GitHub login via Supabase Auth, create site + siteKey |
| 2 | SDK: collection, batching, beacon, sampling, size budget, unit tests; demo app |
| 3 | Ingest API: validation, origin check, rate limit, tests; first real events from LiveBoard |
| 4 | Dashboard: overview cards, trends, filters, pages table |
| 5 | Page detail + attribution, release comparison, rollups cron + retention |
| 6 | Public demo, landing page, Playwright e2e, Sentry, npm publish, README with trade-offs |

Stretch (only after week 6): React Router adapter for soft navigations, weekly email report, regression alert when p75 worsens > 20 % between releases.

---

## 10. Working agreements for Claude Code

- Read this spec before every task. If a task needs something outside §2 scope, stop and ask.
- Small, conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`), one concern per commit, on a branch with a PR.
- Add or update tests with every logic change. Pure logic goes in pure functions so it can be tested.
- Do not add a dependency without stating why and the gzip cost (SDK) — SDK dependencies need explicit approval.
- Never invent metrics, benchmarks or user numbers in README or docs. Use `[METRIC NEEDED]` placeholders.
- Record every non-obvious decision and its trade-off in `README.md → Decisions`.
- Explain non-trivial code to me in plain words when asked; I must be able to defend every file in an interview.

---

## 11. Interview stories this project should produce
- Why `sendBeacon` on `visibilitychange` instead of `unload`, and what is lost on bfcache / mobile.
- How INP attribution finds the slow interaction, and how you'd fix a slow handler.
- Why p75 and not average; how sampling and small samples bias results.
- Keeping an SDK under 5 KB and never breaking the host page.
- Public keys + origin checks + rate limiting: what they do and don't protect against.
- Row-Level Security: why the database, not the UI, is the real access boundary (and how this fixes the client-side-only access in my work apps).
- Raw events vs rollups: query cost vs freshness trade-off.
