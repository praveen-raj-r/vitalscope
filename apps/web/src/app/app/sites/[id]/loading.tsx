/** Shown while a site view loads for the first time. Later filter changes keep the frame and dim instead. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-10 w-80 rounded-md bg-vz-grid" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-vz-grid" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-vz-grid" />
    </div>
  );
}
