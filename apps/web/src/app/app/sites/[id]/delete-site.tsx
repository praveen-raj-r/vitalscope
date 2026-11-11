"use client";

import { useActionState, useState } from "react";
import { deleteSite, type DeleteSiteState } from "@/app/app/actions";
import { confirmationMatches } from "@/lib/sites";
import { FOCUS } from "@/lib/ui";

/**
 * Collapsed by default. The button stays off until the typed name matches exactly (the server checks again).
 * The public demo site gets an explanation instead of the form, since it can never be deleted.
 */
export function DeleteSite({ id, name, isDemo }: { id: string; name: string; isDemo: boolean }) {
  const [state, action, pending] = useActionState<DeleteSiteState, FormData>(deleteSite, {});
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [touched, setTouched] = useState(false);

  const matches = confirmationMatches(name, typed);
  // A mismatch is only called out once the person has left the field, not on every keystroke.
  const mismatch = touched && typed.trim() !== "" && !matches;
  const panelId = "delete-site-panel";

  return (
    <section className="mt-10 rounded-[14px] bg-vz-surface shadow-[inset_0_0_0_1px_rgb(208_59_59/0.4)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-13 w-full cursor-pointer items-center gap-2.5 rounded-[14px] px-4 text-left text-[15px] font-semibold text-vz-bad hover:bg-[#fbf3f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series md:px-5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="flex-none">
          <path
            d={open ? "M3 4.5L6 8l3-3.5" : "M4.5 3L8 6l-3.5 3"}
            fill="none"
            stroke="#d03b3b"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Delete this site
      </button>

      {open && (
        <div id={panelId} className="flex flex-col gap-4.5 px-4 pt-0.5 pb-4 md:px-5 md:pb-5">
          {isDemo ? (
            <div className="flex items-start gap-3 rounded-[10px] bg-vz-page px-4 py-3.5 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)]">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="mt-px flex-none">
                <circle cx="9" cy="9" r="8" fill="none" stroke="#52514e" strokeWidth="1.5" />
                <path d="M9 8v5M9 5.2v.1" stroke="#52514e" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <div>
                <div className="text-[15px] font-semibold">This site can&apos;t be deleted</div>
                <p className="mt-1.5 text-sm leading-[1.6] text-pretty text-vz-ink-2">
                  <strong className="font-semibold text-vz-ink">{name}</strong> is the public demo site. Anyone can open
                  it without signing in, so it stays in place for everyone.
                </p>
              </div>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-4.5">
              <p className="text-sm leading-[1.6] text-pretty text-vz-ink-2">
                This permanently deletes <strong className="font-semibold text-vz-ink">{name}</strong>, all of its events
                and its daily rollups. Its site key stops working immediately. This cannot be undone.
              </p>
              <input type="hidden" name="id" value={id} />
              <div className="flex max-w-120 flex-col gap-1.5">
                <label htmlFor="delete-confirm" className="text-sm font-medium">
                  Type the site name to confirm
                </label>
                <input
                  id="delete-confirm"
                  name="confirm"
                  autoComplete="off"
                  value={typed}
                  disabled={pending}
                  onChange={(e) => setTyped(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={mismatch || state.error ? true : undefined}
                  aria-describedby="delete-confirm-error"
                  className={`min-h-12 w-full rounded-lg px-3.5 text-base text-vz-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series ${
                    pending ? "bg-[#f1f0ec]" : "bg-vz-surface"
                  } ${mismatch ? "shadow-[inset_0_0_0_2px_#d03b3b]" : "shadow-[inset_0_0_0_1px_rgb(11_11_11/0.28)]"}`}
                />
                <div id="delete-confirm-error" role="alert">
                  {(mismatch || state.error) && (
                    <div className="flex items-center gap-2 text-sm font-medium text-vz-bad">
                      <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true" className="flex-none">
                        <path d="M7 .5L13.5 7 7 13.5.5 7z" fill="#d03b3b" />
                        <path d="M5 5l4 4M9 5l-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      {mismatch ? "That does not match the site name" : state.error}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={!matches || pending}
                  aria-busy={pending}
                  className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg px-5.5 text-[15px] font-medium md:w-auto ${FOCUS} ${
                    pending
                      ? "cursor-progress bg-[#d9d7cd] text-vz-ink-2"
                      : matches
                        ? "cursor-pointer bg-vz-bad text-white hover:bg-[#b53232]"
                        : "cursor-not-allowed bg-[#d9d7cd] text-vz-ink-2"
                  }`}
                >
                  {pending && (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="motion-safe:animate-spin">
                      <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(11,11,11,.18)" strokeWidth="2" />
                      <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="#52514e" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  {pending ? "Deleting…" : "Delete site permanently"}
                </button>
                {!matches && !pending && (
                  <p className="mt-2.5 text-[13px] text-vz-ink-2">The button turns on when the name matches exactly.</p>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
