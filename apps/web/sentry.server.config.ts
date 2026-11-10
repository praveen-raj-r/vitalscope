import * as Sentry from "@sentry/nextjs";
import { DATA_COLLECTION } from "./src/sentry-data-collection";

// Error reporting for the dashboard server (pages, route handlers, the proxy). Nothing is sent unless a DSN is set.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // Errors only: no performance tracing, which keeps the free-tier quota for what matters.
  tracesSampleRate: 0,
  dataCollection: DATA_COLLECTION,
});
