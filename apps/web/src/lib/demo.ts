import { isUuid } from "./sites";

/**
 * The one site the public demo may show, set with the DEMO_SITE_ID environment variable (the "Sample data" site).
 * Anything that is not a UUID counts as "not configured", so a typo can never widen what the demo reads.
 * The demo routes never take a site id from the URL.
 */
export function demoSiteId(value: string | undefined = process.env.DEMO_SITE_ID): string | null {
  const id = value?.trim();
  return id && isUuid(id) ? id : null;
}
