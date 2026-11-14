# Vitalscope

[![CI](https://github.com/praveen-raj-r/vitalscope/actions/workflows/ci.yml/badge.svg)](https://github.com/praveen-raj-r/vitalscope/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@praveen-raj/vitalscope)](https://www.npmjs.com/package/@praveen-raj/vitalscope)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Real-user monitoring for Core Web Vitals.** A tiny SDK measures how fast your pages are for real visitors, and a dashboard shows p75 LCP, INP and CLS by page, device and release.

**[Try the live demo](https://vitalscope-rum.vercel.app/demo)** (sample data, no sign-in)

![Site overview: p75 tiles and trend charts](docs/screenshots/overview.png)

<details>
<summary>More screenshots</summary>

![Landing page](docs/screenshots/landing.png)

![Page detail: distribution per metric](docs/screenshots/page-detail.png)

![Release comparison](docs/screenshots/releases.png)

<img src="docs/screenshots/overview-mobile.png" alt="Site overview on a phone" width="280">

</details>

All screenshots are the public demo, which runs on synthetic data.

## What you get

- **How fast is my site, really?** The 75th-percentile LCP, INP and CLS, rated good, needs improvement or poor.
- **Which pages and devices are slow?** A table of pages, worst first, with the slow element or interaction behind each number.
- **Did the last release help?** Two releases side by side, with the change and the sample size, so you know when to trust it.

## Quick start

```bash
npm install @praveen-raj/vitalscope
```

Create a site in the dashboard to get your public site key, then:

```ts
import { init } from '@praveen-raj/vitalscope';

init({ siteKey: 'vs_pub_your_site_key', release: '1.0.0' });
```

- **Under 5 KB gzipped**, including `web-vitals` (4.72 KB ESM, measured). CI fails if it grows past the budget.
- **Never throws**, sets no cookies, stores no IP addresses, and sends one beacon when the page is hidden.
- The default endpoint is the hosted deployment; pass `endpoint` to use your own.

More in the [SDK README](packages/sdk/README.md).

## How to use

From zero to your first numbers, in five steps.

### 1. Sign in and add your site

1. Open the [dashboard](https://vitalscope-rum.vercel.app/login) and choose **Continue with GitHub**. Vitalscope only reads your public profile.
2. Under **Add site**, enter a **name** and the **allowed origins**, one per line, for example `https://www.example.com`. Only pages on these origins can send data for the site.
   - An origin is scheme + host (+ port), with no path: `https://example.com`, not `https://example.com/shop`.
   - Add `http://localhost:3000` too if you want to try it while developing.
3. Copy the **public site key** (`vs_pub_…`). It is safe to put in your front-end code.

### 2. Install the SDK

```bash
npm install @praveen-raj/vitalscope
```

### 3. Start it once in your app

Pick the setup that matches your app. Set `release` to your version; it is what the release comparison uses.

**Next.js (App Router).** `init` must run in the browser, so put it in a small client component and render it in `app/layout.tsx`:

```tsx
// app/vitalscope.tsx
"use client";
import { useEffect } from "react";
import { init } from "@praveen-raj/vitalscope";

export function Vitalscope() {
  useEffect(() => {
    init({ siteKey: "vs_pub_your_site_key", release: "1.0.0" });
  }, []);
  return null;
}
```

**Vite, React, Vue or any bundled app.** Call it once at start-up, for example in `main.ts`:

```ts
import { init } from "@praveen-raj/vitalscope";

init({ siteKey: "vs_pub_your_site_key", release: "1.0.0" });
```

**Plain HTML, no bundler:**

```html
<script src="https://unpkg.com/@praveen-raj/vitalscope/dist/vitalscope.global.js"></script>
<script>
  Vitalscope.init({ siteKey: "vs_pub_your_site_key", release: "1.0.0" });
</script>
```

Useful options (all in the [SDK README](packages/sdk/README.md#options)): `sampleRate` (0 to 1, to measure only some page views), `routePattern` (turn `/blog/123` into `/blog/:id` so pages group together) and `debug` (log problems to the console).

### 4. Deploy and visit your site

The SDK sends its measurements **when a visitor leaves or hides the page**, not while it loads. So open your site, use it a little, then switch tab or close it. The numbers appear in the dashboard shortly after.

### 5. Read the dashboard

Open your site from **My sites**. Use the **Time range**, **Device** and **Release** filters at the top; they apply to everything on the page.

| Tab | Answers |
|---|---|
| **Overview** | How fast is the site? The p75 of LCP, INP and CLS with a rating, the share of good / needs improvement / poor visits, and a trend per day. |
| **Pages** | Which pages are slowest? Click a column to sort, click a page for its detail. |
| **Page detail** | Why is this page slow? A distribution per metric, and the elements or interactions behind the bad numbers. |
| **Releases** | Did the last release help? Two releases side by side, with the change and the sample size. Needs two different `release` values. |

How to read the numbers:
- **p75** means three out of four visits were as fast as this or faster. It is the figure Google uses.
- **Ratings** are Good, Needs improvement or Poor, always shown with a shape and a word, not just a colour.
- **Not enough data (need 30, have N):** a number backed by fewer than 30 samples is never given a rating. Wait for more traffic, or widen the time range.
- **Lower is better** for all three metrics.

To compare releases, change `release` with each deploy (`"1.0.0"`, then `"1.1.0"`) and give each some traffic.

### Not seeing data?

| Check | Why |
|---|---|
| Did you leave or hide the page? | Reports are sent when the page is hidden, not while it loads. |
| Does the page's origin exactly match an allowed origin? | `https://example.com` and `https://www.example.com` are different origins. A mismatch is rejected. |
| Is the site key right, and is `init` called in the browser? | In Next.js it must run in a client component, not on the server. |
| Open the browser's Network tab | Look for a request to `/api/ingest`. `204` means accepted; `403` means the origin is not allowed; `404` means the site key is unknown. |
| Try `debug: true` | The SDK then logs why it skipped sending. |
| Self-hosting? | Set `endpoint` to your own `/api/ingest` URL. |

To take a look without installing anything, open the **[live demo](https://vitalscope-rum.vercel.app/demo)**: it has the same tabs on sample data.

## How it works

```
 visitor's browser                    Vercel (Next.js)                     Supabase (Postgres)
┌──────────────────┐   one beacon   ┌─────────────────┐   service role   ┌──────────────────┐
│  SDK + web-vitals│ ─────────────▶ │  /api/ingest    │ ───────────────▶ │  events          │
└──────────────────┘  on page hide  │  validate, rate │                  │  daily_rollups   │
                                    │  limit, origin  │                  └────────┬─────────┘
┌──────────────────┐   SQL (RLS)    ├─────────────────┤   rpc, as the user        │
│  Dashboard / demo│ ◀───────────── │  server-rendered│ ◀─────────────────────────┘
└──────────────────┘                │  pages          │      /api/cron/daily rolls up
                                    └─────────────────┘      each day, deletes after 30
```

| Part | Where | Notes |
|---|---|---|
| SDK | [`packages/sdk`](packages/sdk) | TypeScript, tsup, published to npm |
| Dashboard, ingest, cron | [`apps/web`](apps/web) | Next.js 16, React 19, Tailwind 4, Recharts |
| Database | [`supabase/`](supabase) | Migrations, row-level security, pgTAP tests |
| Demo page for tests | [`apps/demo`](apps/demo), [`apps/e2e`](apps/e2e) | Vite page driven by Playwright |

## Run it locally

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase values
npx supabase start                              # needs Docker
pnpm --filter @vitalscope/web dev
```

Tests: `pnpm test` (unit), `pnpm e2e` (real browser), and the pgTAP tests under `supabase/tests`. Everything else, such as GitHub sign-in, sample data, Sentry and the daily job, is in the **[development guide](docs/development.md)**.

## Design choices worth knowing

The full list, with the cost of each, is in **[docs/decisions.md](docs/decisions.md)**. The ones that shape the most:

- **Rollups use a SQL `CUBE`.** A percentile can't be combined across rows, so every filter combination gets its own row. On a quiet site rollups are not smaller than the raw events; they pay off for history and busy pages. ([details](docs/decisions.md#rollups-and-retention))
- **One row per page view and metric.** CLS and INP can be reported again, and counting each report would count a visit several times. ([details](docs/decisions.md#ingest-apiingest))
- **A number backed by under 30 samples is never given a verdict.** One threshold, `MIN_SAMPLES`, for every screen. ([details](docs/decisions.md#dashboard-numbers))
- **The public demo reads sample data with the service role, from one fixed site id.** The safety rests on that id, not on the URL. ([details](docs/decisions.md#data-model-and-security))
- **The Origin check ties a key to a website; it is not authentication.** Rate limiting and validation matter too. ([details](docs/decisions.md#ingest-apiingest))
- **Sentry collects nothing beyond the error itself.** Cookies, headers, user and IP are all switched off. ([details](docs/decisions.md#quality-and-operations))

## Status

All six build weeks are done: SDK, ingest, dashboard, release comparison, rollups, public demo, end-to-end test, Sentry and the npm release. The [spec](vitalscope-spec.md) lists what was asked for. Known gaps: no dark mode, no custom domain yet (the SDK's default endpoint is the Vercel address), and the in-memory rate limiter is per serverless instance.

## License

[MIT](LICENSE)
