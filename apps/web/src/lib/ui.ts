/**
 * Font utilities for the redesigned screens. app/layout.tsx sets --font-sans, --font-serif and --font-mono on
 * <html>, and Tailwind's font-sans / font-serif / font-mono utilities read exactly those variables.
 */
export const SANS = "font-sans";
export const SERIF = "font-serif";
export const MONO = "font-mono";

/** Visible keyboard focus ring in the series blue. */
export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series focus-visible:rounded-md";
