"use client";

import { useEffect, useRef, useState } from "react";
import { FOCUS } from "@/lib/ui";

/** Avatar button that opens a small menu with the signed-in identity and Sign out. */
export function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (root.current && !root.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (email.trim()[0] ?? "?").toUpperCase();

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-0 bg-transparent pr-1.5 pl-1 hover:bg-[#efeee9] ${FOCUS}`}
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-[#d9d7cd] text-sm font-medium text-vz-ink"
        >
          {initial}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            fill="none"
            stroke="#52514e"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-10 mt-1 min-w-62 rounded-xl bg-vz-surface p-1.5 shadow-[0_0_0_1px_rgb(11_11_11/0.1),0_16px_32px_-12px_rgb(11_11_11/0.22)]"
        >
          <div className="mb-1.5 border-b border-vz-border px-3 py-2.5 text-[13px] text-vz-ink-2">
            Signed in with GitHub
            <div className="mt-0.5 text-sm wrap-anywhere text-vz-ink">
              {email}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              autoFocus
              className={`flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-left text-[15px] hover:bg-[#efeee9] ${FOCUS}`}
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
