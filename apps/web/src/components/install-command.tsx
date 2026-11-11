"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { FOCUS, MONO } from "@/lib/ui";

const PACKAGE = "@praveen-raj/vitalscope";

/** Each tab keeps its own verb; the colour is the shared aurora gradient, which is decoration only. */
const MANAGERS = [
  { id: "npm", verb: "install" },
  { id: "pnpm", verb: "add" },
  { id: "yarn", verb: "add" },
  { id: "bun", verb: "add" },
] as const;

/** The install command with a package-manager picker. The copy button always copies the command shown. */
export function InstallCommand() {
  const [active, setActive] = useState<(typeof MANAGERS)[number]["id"]>("npm");
  const current = MANAGERS.find((m) => m.id === active) ?? MANAGERS[0];
  const command = `${current.id} ${current.verb} ${PACKAGE}`;

  return (
    // A 1.5px frame of moving aurora, with the surface inside it.
    <div className="aurora-bg rounded-[11px] p-[1.5px] shadow-[0_8px_28px_-12px_rgb(129_140_248/0.55)]">
    <div className="overflow-hidden rounded-[10px] bg-vz-surface">
      <div role="tablist" aria-label="Package manager" className="flex gap-1 border-b border-vz-grid px-2">
        {MANAGERS.map((m) => {
          const on = m.id === active;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              id={`pm-${m.id}`}
              aria-selected={on}
              aria-controls="pm-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(m.id)}
              onKeyDown={(e) => {
                // Arrow keys move between tabs, as in any tab list.
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                const i = MANAGERS.findIndex((x) => x.id === active);
                const next = MANAGERS[(i + (e.key === "ArrowRight" ? 1 : MANAGERS.length - 1)) % MANAGERS.length]!;
                setActive(next.id);
                document.getElementById(`pm-${next.id}`)?.focus();
              }}
              className={`${MONO} relative flex min-h-10 cursor-pointer items-center gap-1.5 px-3 text-[13px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-vz-series ${
                on ? "font-semibold text-vz-ink" : "text-vz-ink-2 hover:text-vz-ink"
              }`}
            >
              <span aria-hidden="true" className="aurora-bg size-2 rounded-full" />
              {m.id}
              {on && <span aria-hidden="true" className="aurora-bg absolute inset-x-2 -bottom-px h-0.5 rounded-full" />}
            </button>
          );
        })}
      </div>
      <div
        id="pm-panel"
        role="tabpanel"
        aria-labelledby={`pm-${active}`}
        className={`flex items-center justify-between gap-2 bg-[linear-gradient(100deg,rgb(20_184_166/0.08),rgb(129_140_248/0.09),rgb(244_114_182/0.08))] py-1 pr-1 pl-3 text-[12.5px] md:pl-4.5 md:text-sm ${MONO}`}
      >
        <span className="min-w-0 wrap-anywhere">
          <span className="text-vz-muted" aria-hidden="true">
            ${" "}
          </span>
          <span className="aurora-text bg-clip-text font-semibold text-transparent">
            {current.id}
          </span>{" "}
          <span className="text-vz-ink-2">{current.verb}</span>{" "}
          <span className="text-vz-series">{PACKAGE}</span>
        </span>
        <CopyButton
          text={command}
          ariaLabel={`Copy ${current.id} install command`}
          className={`min-h-11 min-w-11 shrink-0 rounded-[7px] px-2.5 text-[13px] font-medium hover:bg-[#efeee9] md:px-3.5 ${FOCUS}`}
        />
      </div>
    </div>
    </div>
  );
}
