"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Re-runs the server render of the current page, for the "Could not load sites" state. */
export function RetryButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
      className="min-h-11 cursor-pointer rounded-lg bg-vz-ink px-4.5 text-sm font-medium text-vz-surface hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series disabled:cursor-progress disabled:bg-vz-ink-2"
    >
      {pending ? "Trying..." : "Try again"}
    </button>
  );
}
