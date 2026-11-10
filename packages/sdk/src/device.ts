import type { Device } from "./types";

/**
 * `uaMobile` is navigator.userAgentData.mobile when the browser provides it.
 * Trade-off: iPadOS reports a desktop-like UA, so iPads count as desktop.
 */
export function detectDevice(width: number, uaMobile?: boolean): Device {
  if (uaMobile === true) return width < 768 ? "mobile" : "tablet";
  if (uaMobile === false) return "desktop";
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
