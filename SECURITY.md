# Security policy

Vitalscope collects performance measurements from visitors' browsers, so security reports are taken seriously.

## Supported versions

Only the latest release gets security fixes.

| Version | Supported |
|---|---|
| 0.1.x (SDK `@praveen-raj/vitalscope`, and the hosted app) | Yes |
| Older | No |

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately instead:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability** ([private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)).

Please include:

- what the problem is and where (the SDK, `/api/ingest`, the dashboard, the daily job, the database policies);
- steps to reproduce it, or a small proof of concept;
- what an attacker could do with it, and which version you tested.

This is a one-person project, so replies are best effort: you can expect an acknowledgement within about 7 days. Confirmed issues are fixed as soon as I can, and I will credit you in the release notes unless you prefer not to be named.

## What is in scope

- **The SDK** (`packages/sdk`): anything that could leak data, break a host page, or run unexpected code.
- **Ingest** (`/api/ingest`): origin and rate-limit bypasses, ways to write data for a site you do not own, oversized or malformed input that is accepted.
- **The dashboard and API routes** (`apps/web`): authentication or authorisation problems, including reading another user's site (row-level security is the boundary).
- **The database** (`supabase/`): policies and functions that expose or modify data they should not.
- **The cron endpoint** (`/api/cron/daily`).

## What is not in scope

- The public demo's data. It is synthetic and meant to be read by anyone.
- Findings that need a stolen secret (for example the service-role key) or physical access to a machine.
- Denial of service by sheer volume. The ingest rate limiter is per server instance and documented as such in [docs/decisions.md](docs/decisions.md).
- Vulnerabilities in third-party services (GitHub, Supabase, Vercel, Sentry). Please report those to them.
- Automated scanner output with no demonstrated impact.

## How data is handled

The SDK sets no cookies, stores nothing in the browser and sends no user identifiers. The server does not store IP addresses. Details are in the [README](README.md) and [docs/decisions.md](docs/decisions.md).

Thank you for helping keep Vitalscope and its users safe.
