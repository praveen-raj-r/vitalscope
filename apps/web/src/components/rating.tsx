import { RATING_LABELS, type Rating } from "@/lib/vitals";

const COLORS: Record<Rating, string> = {
  good: "var(--color-vz-good)",
  "needs-improvement": "var(--color-vz-warn)",
  poor: "var(--color-vz-bad)",
};

/** A distinct shape per rating (circle, triangle, diamond), so the state never rests on colour alone. */
export function RatingShape({ rating, size = 12 }: { rating: Rating; size?: number }) {
  const fill = COLORS[rating];
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
      {rating === "good" && <circle cx="7" cy="7" r="7" fill={fill} />}
      {rating === "needs-improvement" && <path d="M7 .8L13.4 12.6H.6z" fill={fill} />}
      {rating === "poor" && (
        <rect x="1" y="1" width="12" height="12" rx="2" fill={fill} transform="rotate(45 7 7) scale(.86) translate(1 1)" />
      )}
    </svg>
  );
}

/** The shape with a mark inside (check, exclamation, cross), used in the larger rating pill. */
export function RatingGlyph({ rating, size = 14 }: { rating: Rating; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
      {rating === "good" && (
        <>
          <circle cx="7" cy="7" r="7" fill={COLORS.good} />
          <path d="M4 7.2l2 2L10 5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {rating === "needs-improvement" && (
        <>
          <path d="M7 .8L13.4 12.6H.6z" fill={COLORS["needs-improvement"]} />
          <path d="M7 5.2v3.4M7 10.2v.1" stroke="#0b0b0b" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {rating === "poor" && (
        <>
          <rect x="1" y="1" width="12" height="12" rx="2.5" fill={COLORS.poor} transform="rotate(45 7 7) scale(.86) translate(1 1)" />
          <path d="M5 5l4 4M9 5l-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
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

/** Outlined pill with a glyph, for the headline tiles. */
export function RatingPill({ rating }: { rating: Rating }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-vz-page py-1 pr-2.5 pl-2 text-[13px] font-medium shadow-[inset_0_0_0_1px_rgb(11_11_11/0.14)]">
      <RatingGlyph rating={rating} />
      {RATING_LABELS[rating]}
    </span>
  );
}

export { COLORS as RATING_COLORS };
