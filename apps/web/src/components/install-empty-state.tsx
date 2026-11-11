import { CopyButton } from "@/components/copy-button";
import { installSnippet } from "@/lib/sites";
import { CARD, FOCUS, MONO, SERIF } from "@/lib/ui";

export function InstallEmptyState({
  siteKey,
  endpoint,
  filtered,
}: {
  siteKey: string;
  endpoint: string;
  filtered: boolean;
}) {
  if (filtered) {
    return (
      <section className={`${CARD} p-4.5 md:p-7`}>
        <h2
          className={`${SERIF} mb-2 text-[28px] leading-[1.15] font-normal tracking-[-0.015em]`}
        >
          No data for these filters
        </h2>
        <p className="max-w-140 text-[15px] leading-[1.55] text-pretty text-vz-ink-2">
          Try a longer time range, or set the device and release filters back to
          All.
        </p>
      </section>
    );
  }

  const snippet = installSnippet(siteKey, endpoint);
  return (
    <section className={`${CARD} p-4.5 md:p-7`}>
      <div
        role="status"
        className="flex w-fit max-w-full items-center gap-2.5 rounded-full bg-vz-page px-3.5 py-2.5 text-sm font-medium shadow-[inset_0_0_0_1px_rgb(11_11_11/0.14)]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          aria-hidden="true"
          className="flex-none"
        >
          <circle
            cx="7"
            cy="7"
            r="5.5"
            fill="none"
            stroke="#52514e"
            strokeWidth="1.6"
            strokeDasharray="3 2.4"
          />
        </svg>
        Waiting for the first event
      </div>
      <h2
        className={`${SERIF} mt-5 mb-2 text-[28px] leading-[1.15] font-normal tracking-[-0.015em]`}
      >
        Install the SDK to start collecting data
      </h2>
      <p className="mb-6 max-w-140 text-[15px] leading-[1.55] text-pretty text-vz-ink-2">
        Data appears here after the first visitor loads a page that runs the SDK
        and then leaves it.
      </p>

      <div className="mb-1.5 text-[13px] font-medium text-vz-ink-2">
        1 · Public site key
      </div>
      <div className="mb-5.5 flex items-center justify-between gap-2 rounded-[10px] bg-vz-page py-1 pr-1 pl-3.5 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)]">
        <code className={`${MONO} min-w-0 text-sm wrap-anywhere`}>
          {siteKey}
        </code>
        <CopyButton
          text={siteKey}
          ariaLabel="Copy site key"
          className={`min-h-11 min-w-16 flex-none cursor-pointer rounded-[7px] px-3.5 text-[13px] font-medium hover:bg-[#efeee9] ${FOCUS}`}
        />
      </div>

      <div className="mb-1.5 text-[13px] font-medium text-vz-ink-2">
        2 · Add the snippet to your app
      </div>
      <div className="relative rounded-xl bg-vz-ink text-[#f1f0ec]">
        <CopyButton
          text={snippet}
          ariaLabel="Copy install snippet"
          className="absolute top-2 right-2 min-h-11 min-w-16 cursor-pointer rounded-[7px] bg-white/10 px-3.5 text-[13px] font-medium text-vz-surface hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        />
        <pre
          className={`${MONO} m-0 overflow-auto p-4.5 pt-14 text-[13.5px] leading-[1.75] whitespace-pre-wrap wrap-anywhere md:p-7 md:pt-14`}
        >
          {snippet}
        </pre>
      </div>
    </section>
  );
}
