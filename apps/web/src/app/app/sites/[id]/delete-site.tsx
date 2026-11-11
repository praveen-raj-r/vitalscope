"use client";

import { useActionState } from "react";
import { deleteSite, type DeleteSiteState } from "@/app/app/actions";

export function DeleteSite({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<DeleteSiteState, FormData>(deleteSite, {});
  return (
    <details className="group mt-10 rounded-[14px] bg-vz-surface shadow-[inset_0_0_0_1px_rgb(208_59_59/0.4)]">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold text-vz-bad focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series md:px-6 [&::-webkit-details-marker]:hidden">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="transition-transform group-open:rotate-90 motion-reduce:transition-none"
        >
          <path d="M4 2.5L8 6l-4 3.5" fill="none" stroke="#d03b3b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Delete this site
      </summary>
      <form action={action} className="flex flex-col gap-4 px-4 pb-4 md:px-6 md:pb-6">
        <p className="text-sm leading-[1.6] text-vz-ink-2">
          This permanently deletes <strong className="text-vz-ink">{name}</strong>, all of its events and its daily
          rollups. Its site key stops working immediately. This cannot be undone.
        </p>
        <input type="hidden" name="id" value={id} />
        <div className="flex max-w-120 flex-col gap-1.5">
          <label htmlFor="delete-confirm" className="text-sm font-medium">
            Type the site name to confirm
          </label>
          <input
            id="delete-confirm"
            name="confirm"
            required
            autoComplete="off"
            aria-invalid={state.error ? true : undefined}
            className="min-h-12 w-full rounded-lg bg-vz-surface px-3.5 text-base shadow-[inset_0_0_0_1px_rgb(11_11_11/0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series"
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-vz-bad">
            {state.error}
          </p>
        )}
        <div>
          <button
            disabled={pending}
            className="min-h-12 cursor-pointer rounded-lg bg-vz-bad px-5 text-[15px] font-medium text-white hover:bg-[#b53232] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series disabled:cursor-progress disabled:opacity-60"
          >
            {pending ? "Deleting..." : "Delete site permanently"}
          </button>
        </div>
      </form>
    </details>
  );
}
