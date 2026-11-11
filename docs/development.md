# Development guide

Setting up, running and operating Vitalscope. For the overview, see the [README](../README.md); for why things are built this way, [decisions.md](decisions.md).

**Contents:** [Run it locally](#run-it-locally) · [Sample data](#sample-data) · [Public demo](#public-demo-and-landing-page) · [End-to-end test](#end-to-end-test) · [Error reporting](#error-reporting-sentry) · [Daily rollups](#daily-rollups-and-retention)

## Run it locally

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase values
npx supabase start                              # needs Docker
pnpm --filter @vitalscope/web dev
```

GitHub login needs an OAuth app (callback URL: `<supabase url>/auth/v1/callback`) and `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` set for the Supabase CLI.

## Sample data

To see the dashboard filled in without real traffic, run [`supabase/sample-data.sql`](../supabase/sample-data.sql) by hand (set your email at the top first). It creates a separate site called "Sample data" with about 2,600 invented events, so real counts stay clean. Remove it with `delete from vitalscope.sites where name = 'Sample data';`. All of its numbers are synthetic and must never be quoted as real results.

## Public demo and landing page

`/` is the landing page and `/demo` is a read-only copy of the dashboard on the sample data, with no sign-in. The demo is turned on by setting `DEMO_SITE_ID` (the id of the "Sample data" site) in the server environment; without it `/demo` says it is not available. **Only ever point it at synthetic data**, because it reads that site with the service role.

## End-to-end test

```bash
pnpm e2e      # builds the SDK, starts the demo page and a stub ingest server, and drives a real browser
```

Locally it uses the Microsoft Edge you already have installed (nothing to download); set `PW_CHANNEL=chrome` or `PW_CHANNEL=` (Playwright's Chromium, after `pnpm --filter @vitalscope/e2e exec playwright install chromium`) to change that. In CI it runs on pushes to `main`.

## Error reporting (Sentry)

The dashboard app reports unhandled errors to Sentry (server, browser, error boundaries, and the 500s that ingest and cron handle themselves). **With no DSN nothing is sent.** To turn it on:

1. Create a free account at sentry.io and a project with the **Next.js** platform. Do not run the Sentry setup wizard: the code is already in place and the wizard would rewrite files.
2. Copy the project's DSN (Settings, Projects, your project, Client Keys). Put it in `apps/web/.env.local` as `NEXT_PUBLIC_SENTRY_DSN=...` and restart the dev server. A DSN only allows sending events, so it is safe to expose.
3. Check the server side: set `CRON_SECRET` in `.env.local`, restart, then run `curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/sentry-check`. It answers 500 on purpose, and the issue "Sentry check: this error was thrown on purpose" should appear in Sentry within a minute.
4. Check the browser side: in the dashboard's DevTools console run `setTimeout(() => { throw new Error("client test") })`.
5. Open one of those events in Sentry and confirm it has no cookies, no request headers and no user. If it does, stop and fix the configuration in `src/sentry-data-collection.ts` before deploying.
6. After deploying to Vercel, add `NEXT_PUBLIC_SENTRY_DSN` to the project's environment variables. For readable stack traces, also create an organisation auth token in Sentry and set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` there (not locally): with a token the build uploads source maps, without one it does not contact Sentry at all.

## Daily rollups and retention

`GET /api/cron/daily` rolls up yesterday (and the day before, again, to absorb late updates), rolls up any finished day a missed run left behind, and only then deletes raw events older than 30 days. It is protected by `CRON_SECRET` (any long random string, for example `openssl rand -hex 32`) sent as `Authorization: Bearer <secret>`; without a secret it returns 503. [`apps/web/vercel.json`](../apps/web/vercel.json) schedules it for 00:15 UTC once deployed (Vercel Cron only runs on a deployed app, and sends the bearer token itself when `CRON_SECRET` is set in the project).

To try it locally, set `CRON_SECRET` in `apps/web/.env.local`, restart the dev server and run `curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/cron/daily`. **It writes to the database in your `.env.local`.** The result lists the rollup rows written, the missing days rolled up and the events deleted.
