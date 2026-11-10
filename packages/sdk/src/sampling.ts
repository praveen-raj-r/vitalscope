/** Decided once per page view. Invalid rates fall back to 1 (collect everything). */
export function isSampled(rate: number | undefined, random: () => number = Math.random): boolean {
  if (rate === undefined || Number.isNaN(rate)) return true;
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  return random() < rate;
}
