export const DAY_OPTIONS = [7, 30] as const;
export const DEVICE_OPTIONS = ["mobile", "tablet", "desktop"] as const;

export type Days = (typeof DAY_OPTIONS)[number];
export type DeviceFilter = (typeof DEVICE_OPTIONS)[number];

export interface Filters {
  days: Days;
  device: DeviceFilter | null;
  release: string | null;
}

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Anything unexpected in the URL falls back to the default, so a hand-edited URL cannot break the page.
 * `defaultDays` is per page: the release comparison defaults to 30 days, the rest to 7.
 */
export function parseFilters(params: Params, defaultDays: Days = 7): Filters {
  const days = Number(first(params.days));
  const device = first(params.device);
  const release = first(params.release);
  return {
    days: (DAY_OPTIONS as readonly number[]).includes(days) ? (days as Days) : defaultDays,
    device: (DEVICE_OPTIONS as readonly string[]).includes(device ?? "") ? (device as DeviceFilter) : null,
    release: release && release.length <= 100 ? release : null,
  };
}

/** Query string for the active filters. `days` is always written, because its default differs per page. */
export function filtersToParams(filters: Filters, into = new URLSearchParams()): URLSearchParams {
  into.delete("days");
  into.delete("device");
  into.delete("release");
  into.set("days", String(filters.days));
  if (filters.device) into.set("device", filters.device);
  if (filters.release) into.set("release", filters.release);
  return into;
}

export function hasActiveFilters(filters: Filters): boolean {
  return filters.device !== null || filters.release !== null;
}
