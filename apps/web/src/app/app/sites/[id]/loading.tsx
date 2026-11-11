import { CARD } from "@/lib/ui";

const BONE = "bg-[#e9e8e2]";

/** Shown while a site view loads for the first time. Later filter changes keep the frame and dim instead. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="motion-safe:animate-pulse">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${CARD} flex flex-col gap-3.5 p-4 md:p-6`}>
            <div className={`h-3 w-3/5 rounded-md ${BONE}`} />
            <div className={`h-9 w-[45%] rounded-lg ${BONE}`} />
            <div className={`h-3 w-2/5 rounded-md ${BONE}`} />
            <div className={`h-2 rounded ${BONE}`} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${CARD} p-4 md:p-6`}>
            <div className={`mb-2.5 h-3.5 w-1/2 rounded-md ${BONE}`} />
            <div className={`mb-4.5 h-3 w-[70%] rounded-md ${BONE}`} />
            <div className="h-40 rounded-lg bg-[#efeee9] md:h-50" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
