import type { init } from "@sentry/nextjs";

type DataCollection = NonNullable<NonNullable<Parameters<typeof init>[0]>["dataCollection"]>;

/**
 * What the Sentry SDK may attach to an error. Its defaults collect cookies (this app's session cookie), request
 * headers and bodies, query strings, user info and local variable values, so every one of them is switched off:
 * an error report should say what broke and where, not who was using the page. Used by both the server and the browser.
 */
export const DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  stackFrameVariables: false,
};
