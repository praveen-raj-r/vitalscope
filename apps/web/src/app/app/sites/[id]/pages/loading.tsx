import { CARD } from "@/lib/ui";

const BONE = "h-3.5 rounded-md bg-[#e9e8e2]";

/** Table-shaped placeholder while the pages list loads. On narrow screens each row shows only path and views. */
export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading pages"
      className={`${CARD} flex flex-col gap-1 p-4 motion-safe:animate-pulse md:gap-0 md:p-6`}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex h-14 items-center gap-4 md:h-13">
          <div className={`${BONE} flex-2`} />
          <div className={`${BONE} flex-1`} />
          <div className={`${BONE} hidden flex-1 md:block`} />
          <div className={`${BONE} hidden flex-1 md:block`} />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
