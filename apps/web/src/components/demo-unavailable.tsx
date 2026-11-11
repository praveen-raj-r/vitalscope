import Link from "next/link";
import { CARD, FOCUS, SERIF } from "@/lib/ui";

/** Shown when DEMO_SITE_ID is not set on this deployment. It offers the two things a visitor can still do. */
export function DemoUnavailable() {
  return (
    <section className={`${CARD} flex flex-col items-center px-4.5 py-10 text-center md:px-7 md:py-18`}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="16" fill="none" stroke="#898781" strokeWidth="1.6" />
        <path d="M9 21.5h4l2.5-6 4 9 2.5-5H27" fill="none" stroke="#898781" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 className={`${SERIF} mt-4.5 mb-2.5 text-[28px] leading-[1.15] font-normal tracking-[-0.02em] md:text-[36px]`}>
        The live demo isn&apos;t available right now
      </h1>
      <p className="max-w-120 text-base leading-[1.6] text-pretty text-vz-ink-2">
        The demo hasn&apos;t been set up on this deployment yet. You can still sign in with GitHub, or add the SDK to your
        own site.
      </p>
      <div className="mt-6 flex w-full flex-wrap justify-center gap-2.5">
        <Link
          href="/login"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-vz-ink px-5.5 text-[15px] font-medium text-vz-surface no-underline hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series md:w-auto"
        >
          Sign in with GitHub
        </Link>
        <Link
          href="/#install"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-vz-surface px-5.5 text-[15px] font-medium text-vz-ink no-underline shadow-[inset_0_0_0_1px_rgb(11_11_11/0.22)] hover:bg-[#efeee9] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series md:w-auto"
        >
          Install the SDK
        </Link>
      </div>
      <Link href="/" className={`mt-2 inline-flex min-h-11 items-center text-sm text-vz-ink-2 no-underline ${FOCUS}`}>
        ← Back to Vitalscope
      </Link>
    </section>
  );
}
