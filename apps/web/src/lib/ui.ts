/**
 * Font utilities for the redesigned screens. app/layout.tsx sets --font-sans, --font-serif and --font-mono on
 * <html>, and Tailwind's font-sans / font-serif / font-mono utilities read exactly those variables.
 */
export const SANS = "font-sans";
export const SERIF = "font-serif";
export const MONO = "font-mono";

/** The raised-surface card used across the dashboard: surface fill, 14px corners, 1px inset hairline. */
export const CARD = "rounded-[14px] bg-vz-surface shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)]";

/** Visible keyboard focus ring in the series blue. */
export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series focus-visible:rounded-md";
