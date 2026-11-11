import Link from "next/link";
import { SERIF } from "@/lib/ui";

/** The 404 content, shared by the public 404 page and the one inside the signed-in app. */
export function NotFoundCard({ href, label }: { href: string; label: string }) {
  return (
    <div className="max-w-140 py-4 md:py-10">
      <div className="font-mono text-[13px] font-medium tracking-[0.08em] text-vz-ink-2">404</div>
      <h1 className={`${SERIF} my-3.5 text-4xl leading-[1.08] font-normal tracking-[-0.02em] text-balance md:text-[56px]`}>
        This page does not exist
      </h1>
      <p className="mb-7 text-base leading-[1.6] text-pretty text-vz-ink-2">
        The address may be mistyped, or the page may have been moved or deleted.
      </p>
      <Link
        href={href}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-vz-ink px-5.5 text-[15px] font-medium text-vz-surface no-underline hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series md:w-auto"
      >
        {label}
      </Link>
    </div>
  );
}
