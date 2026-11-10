import { defineConfig } from "@playwright/test";

const CI = !!process.env.CI;

/**
 * Locally this drives the Microsoft Edge you already have installed, so nothing needs downloading. In CI it uses
 * Playwright's own Chromium (installed with `playwright install chromium`). Override with PW_CHANNEL
 * (for example PW_CHANNEL=chrome, or PW_CHANNEL= to use Playwright's Chromium).
 *
 * Both servers are started for you. Build the SDK first (`pnpm --filter @vitalscope/sdk build`): the demo page imports it.
 */
const channel = process.env.PW_CHANNEL !== undefined ? process.env.PW_CHANNEL || undefined : CI ? undefined : "msedge";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: CI ? 1 : 0,
  workers: 1, // one shared in-memory event store, so tests must not overlap
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    channel,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npx tsx server/stub-ingest.ts",
      url: "http://localhost:3100/__health",
      reuseExistingServer: !CI,
      timeout: 30_000,
    },
    {
      // The Vite demo page: it loads the real SDK from packages/sdk.
      command: "npx vite --port 5173 --strictPort",
      cwd: "../demo",
      url: "http://localhost:5173",
      reuseExistingServer: !CI,
      timeout: 60_000,
    },
  ],
});
