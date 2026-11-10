import * as Sentry from "@sentry/nextjs";
import { DATA_COLLECTION } from "./sentry-data-collection";

// Error reporting for the browser. Nothing is sent unless a DSN is set.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
  dataCollection: DATA_COLLECTION,
});
