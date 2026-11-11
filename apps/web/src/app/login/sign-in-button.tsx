"use client";

import { useState } from "react";
import { GitHubMark } from "@/components/brand";
import { SANS } from "@/lib/ui";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "error";

/** The OAuth button plus its error message. `failed` is true when the callback sent the visitor back with ?error. */
export function SignInButton({ failed }: { failed: boolean }) {
  const [status, setStatus] = useState<Status>(failed ? "error" : "idle");

  async function signIn() {
    setStatus("loading");
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      // On success the browser leaves for GitHub, so "loading" stays until the page unloads.
      if (error) setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const loading = status === "loading";
  return (
    <>
      {status === "error" && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-[10px] bg-vz-surface px-3.5 py-3 text-sm leading-normal shadow-[inset_0_0_0_1px_var(--color-vz-bad)]"
        >
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true" className="mt-0.5 shrink-0">
            <rect x="1" y="1" width="12" height="12" rx="2.5" fill="var(--color-vz-bad)" transform="rotate(45 7 7) scale(.86) translate(1 1)" />
            <path d="M5 5l4 4M9 5l-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>
            <strong className="font-semibold">Sign-in failed.</strong> We couldn&apos;t complete the connection with
            GitHub.
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        aria-busy={loading}
        className={`flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg text-[15px] font-medium text-vz-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-vz-series ${SANS} ${
          loading ? "cursor-progress bg-vz-ink-2" : "bg-vz-ink hover:bg-[#2b2a28]"
        }`}
      >
        {loading ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="motion-safe:animate-spin">
            <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" />
            <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <GitHubMark />
        )}
        {loading ? "Redirecting to GitHub..." : status === "error" ? "Try again" : "Continue with GitHub"}
      </button>
      <span className="sr-only" role="status">
        {loading ? "Redirecting to GitHub" : ""}
      </span>
    </>
  );
}

