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
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
