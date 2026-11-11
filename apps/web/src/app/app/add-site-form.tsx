"use client";

import { useActionState } from "react";
import { CopyButton } from "@/components/copy-button";
import { installSnippet } from "@/lib/sites";
import { FOCUS, MONO, SERIF } from "@/lib/ui";
import { createSite, type CreateSiteState } from "./actions";

const SERIF_H2 = `${SERIF} text-[28px] leading-[1.15] tracking-[-0.015em] font-normal`;

function ErrorGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="mt-0.5 flex-none"
    >
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="2.5"
        fill="#d03b3b"
        transform="rotate(45 7 7) scale(.86) translate(1 1)"
      />
      <path
        d="M5 5l4 4M9 5l-4 4"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The "site just created" panel, the list slot (children) and the Add site form. They share one form action's
 * state: the panel appears above the list when a site is created, and the form is emphasised when there are no
 * sites yet.
 */
export function SitesPanel({
  endpoint,
  empty,
  children,
}: {
  endpoint: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<CreateSiteState, FormData>(
    createSite,
    {},
  );
  const originsError =
    state.error && state.field === "origins" ? state.error : undefined;
  const otherError =
    state.error && state.field !== "origins" ? state.error : undefined;

  return (
    <>
      {state.site && (
        <section className="mb-8 rounded-[14px] border-t-[3px] border-t-vz-good bg-vz-surface p-4.5 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)] md:p-6">
          <div className="flex items-center gap-2.5 text-[17px] font-medium">
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden="true">
              <circle cx="7" cy="7" r="7" fill="#0ca30c" />
              <path
                d="M4 7.2l2 2L10 5"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span role="status">Site created: {state.site.name}</span>
          </div>
          <p className="mt-2.5 mb-4.5 text-[15px] leading-[1.55] text-pretty text-vz-ink-2">
            Add this to your app to start collecting real-user data.
          </p>
          <div className="mb-1.5 text-[13px] font-medium text-vz-ink-2">
            Public site key
          </div>
          <div className="mb-4.5 flex items-center justify-between gap-2 rounded-[10px] bg-vz-page py-1 pr-1 pl-3.5 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)]">
            <code className={`${MONO} min-w-0 text-sm wrap-anywhere`}>
              {state.site.siteKey}
            </code>
            <CopyButton
              text={state.site.siteKey}
              ariaLabel="Copy site key"
              className={`min-h-11 min-w-16 flex-none cursor-pointer rounded-[7px] px-3.5 text-[13px] font-medium hover:bg-[#efeee9] ${FOCUS}`}
            />
          </div>
          <div className="mb-1.5 text-[13px] font-medium text-vz-ink-2">
            Install snippet
          </div>
          <div className="relative rounded-xl bg-vz-ink text-[#f1f0ec]">
            <CopyButton
              text={installSnippet(state.site.siteKey, endpoint)}
              ariaLabel="Copy install snippet"
              className="absolute top-2 right-2 min-h-11 min-w-16 cursor-pointer rounded-[7px] bg-white/10 px-3.5 text-[13px] font-medium text-vz-surface hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
            <pre
              className={`${MONO} m-0 overflow-auto p-4.5 pt-14 text-[13.5px] leading-[1.75] whitespace-pre-wrap wrap-anywhere md:p-6 md:pt-14`}
            >
              {installSnippet(state.site.siteKey, endpoint)}
            </pre>
          </div>
        </section>
      )}

      {children}

      <section
        className={
          empty
            ? "mt-6 rounded-[14px] bg-vz-surface p-4.5 shadow-[inset_0_0_0_2px_#0b0b0b] md:p-7"
            : "mt-12"
        }
      >
        <h2 className={`${SERIF_H2} mb-5`}>Add site</h2>
        <form action={action} className="flex max-w-160 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="site-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="site-name"
              name="name"
              required
              maxLength={100}
              defaultValue={state.values?.name}
              aria-invalid={state.field === "name" ? true : undefined}
              className="min-h-12 w-full rounded-lg bg-vz-surface px-3.5 text-base shadow-[inset_0_0_0_1px_rgb(11_11_11/0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="site-origins" className="text-sm font-medium">
              Allowed origins{" "}
              <span className="font-normal text-vz-ink-2">(one per line)</span>
            </label>
            <textarea
              id="site-origins"
              name="origins"
              required
              rows={3}
              placeholder="https://example.com"
              defaultValue={state.values?.origins}
              aria-invalid={originsError ? true : undefined}
              aria-describedby={originsError ? "origins-error" : "origins-hint"}
              className={`${MONO} w-full resize-y rounded-lg bg-vz-surface px-3.5 py-3 text-sm leading-[1.6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series ${
                originsError
                  ? "shadow-[inset_0_0_0_2px_#d03b3b]"
                  : "shadow-[inset_0_0_0_1px_rgb(11_11_11/0.28)]"
              }`}
            />
            {originsError && (
              <div
                id="origins-error"
                role="alert"
                className="flex items-start gap-2 text-sm leading-normal font-medium text-vz-bad"
              >
                <ErrorGlyph />
                <span className="wrap-anywhere">{originsError}</span>
              </div>
            )}
            <div id="origins-hint" className="text-[13px] text-vz-ink-2">
              Only these origins can send data for this site
            </div>
          </div>
          {otherError && (
            <div
              role="alert"
              className="flex items-start gap-2 text-sm leading-normal font-medium text-vz-bad"
            >
              <ErrorGlyph />
              <span className="wrap-anywhere">{otherError}</span>
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={pending}
              className="min-h-12 w-full cursor-pointer rounded-lg bg-vz-ink px-6 text-[15px] font-medium text-vz-surface hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series disabled:cursor-progress disabled:bg-vz-ink-2 md:w-auto"
            >
              {pending ? "Adding..." : "Add site"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
