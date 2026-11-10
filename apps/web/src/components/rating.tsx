import { RATING_LABELS, type Rating } from "@/lib/vitals";

const COLORS: Record<Rating, string> = {
  good: "var(--color-vz-good)",
  "needs-improvement": "var(--color-vz-warn)",
  poor: "var(--color-vz-bad)",
};

/** A distinct shape per rating (circle, triangle, square), so the state never rests on colour alone. */
export function RatingShape({ rating, size = 12 }: { rating: Rating; size?: number }) {
  const fill = COLORS[rating];
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
      {rating === "good" && <circle cx="6" cy="6" r="5" fill={fill} />}
      {rating === "needs-improvement" && <path d="M6 1 L11.5 11 H0.5 Z" fill={fill} />}
      {rating === "poor" && <rect x="1" y="1" width="10" height="10" rx="1.5" fill={fill} />}
    </svg>
  );
}

/** Text stays in the ink colour; the shape beside it carries the status colour. */
export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-vz-ink">
      <RatingShape rating={rating} />
      {RATING_LABELS[rating]}
    </span>
  );
}

export { COLORS as RATING_COLORS };
