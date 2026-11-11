"use client";

import { useEffect, useRef, useState } from "react";

/** Copies `text` to the clipboard and says "Copied" for a moment. Fails quietly where the clipboard is blocked. */
export function CopyButton({
  text,
  ariaLabel,
  className = "",
}: {
  text: string;
  ariaLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" onClick={copy} aria-label={ariaLabel} className={className}>
      <span className="inline-flex items-center justify-center gap-1.5">
        {/* An icon beside the word, so the change to "Copied" is seen as well as read. */}
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {copied ? (
            <path d="M2.5 7.5l3 3 6-7" />
          ) : (
            <>
              <rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.5" />
              <path d="M9.5 4.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" />
            </>
          )}
        </svg>
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </span>
    </button>
  );
}
