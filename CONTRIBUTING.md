# Contributing to Vitalscope

Thanks for taking an interest. This is a small project, so the process is light. Bug reports, ideas and pull requests are all welcome.

## Before you start

- **Found a bug or have an idea?** [Open an issue](../../issues/new/choose) using one of the templates. For anything larger than a small fix, please open an issue first so we can agree on the approach before you spend time on it.
- **Found a security problem?** Do not open a public issue. See [SECURITY.md](SECURITY.md).
- **Want to understand the design?** Read the [README](README.md) and [docs/decisions.md](docs/decisions.md). Most non-obvious choices, and what they cost, are written down there.

## Set up

You need Node 20 or newer (the version in [.nvmrc](.nvmrc) is what CI uses) and [pnpm](https://pnpm.io/) 9.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase values
npx supabase start                              # needs Docker
pnpm --filter @vitalscope/web dev
```

The [development guide](docs/development.md) covers GitHub sign-in, sample data, Sentry and the daily job.

## The project at a glance

| Folder | What it is |
|---|---|
| `packages/sdk` | The browser SDK, published to npm as `@praveen-raj/vitalscope` |
| `apps/web` | The dashboard, the ingest route, the cron route and the public demo (Next.js) |
| `apps/demo`, `apps/e2e` | A test page and the Playwright end-to-end test |
| `supabase/` | Migrations, row-level security and the pgTAP tests |
| `docs/` | The development guide, design decisions and screenshots |

## Before you open a pull request

Run the same checks CI runs. All of them should pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm size        # the SDK must stay under 5 KB gzipped
pnpm e2e         # real browser; needs Microsoft Edge or Chrome (see docs/development.md)
```

The database tests run in CI with `supabase test db`. If you change a migration, a policy or a SQL function, run them locally too and add a test for the behaviour you changed.

## Guidelines

- **Keep the SDK tiny.** It has a hard 5 KB budget and one dependency (`web-vitals`). A new SDK feature has to pay for itself in bytes; say what it costs in the pull request.
- **Never trust the client.** Anything that arrives at `/api/ingest` is validated, and the database's row-level security is the real access boundary.
- **Privacy is a feature.** No cookies, no IP addresses stored, no user ids, no full URLs with query strings. A change that collects more needs a strong reason and an issue first.
- **Test what you change.** Logic goes in a Vitest test, database behaviour in a pgTAP test, browser behaviour in the end-to-end test.
- **Follow the design system.** Colour tokens and fonts live in `apps/web/src/app/globals.css` and `apps/web/src/lib/ui.ts`. A rating is always shown with a shape and a word, never colour alone, and interactive targets should be at least 44 px tall.
- **Write down trade-offs.** If you make a choice with a cost, add a short entry to [docs/decisions.md](docs/decisions.md).
- **No secrets.** Never commit `.env` files, keys or tokens. The Supabase service-role key must never reach the browser.

## Commits and pull requests

- Use short, descriptive commit messages in the style already in the history: `feat: …`, `fix: …`, `docs: …`, `chore: …`, `refactor: …`, `test: …`.
- Keep a pull request to one change. Small ones are reviewed faster.
- Describe what changed and why, and how you checked it. Add screenshots for anything visual, at desktop and phone width.
- `main` is protected: it cannot be deleted or force-pushed.

## Questions

Open an issue with the question template, or start from the [how to use](README.md#how-to-use) section if you are trying to set Vitalscope up on a site.

By contributing you agree that your work is released under the project's [MIT licence](LICENSE).
