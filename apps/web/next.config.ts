import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  // Readable stack traces in Sentry need source maps uploaded at build time, which needs an auth token.
  // Without SENTRY_AUTH_TOKEN (for example locally) nothing is uploaded and the build does not contact Sentry.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
