import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { FOCUS, MONO, SERIF } from "@/lib/ui";
import { SitesPanel } from "./add-site-form";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "My sites · Vitalscope" };

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function SitesPage() {
  const supabase = await createClient();
  // RLS limits this to the signed-in user's sites.
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, name, site_key, allowed_origins, created_at")
    .order("created_at", { ascending: false });

  const endpoint = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/ingest`;
  const empty = !error && (sites?.length ?? 0) === 0;

  return (
    <>
      <h1
        className={`${SERIF} mb-7 text-[40px] leading-[1.1] font-normal tracking-[-0.02em]`}
      >
        My sites
      </h1>
      <SitesPanel endpoint={endpoint} empty={empty}>
        {error && (
          <div
            role="alert"
            className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-vz-surface p-4 shadow-[inset_0_0_0_1px_#d03b3b] md:px-4.5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 14 14"
              aria-hidden="true"
              className="flex-none"
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
            <span className="min-w-40 flex-1 text-[15px] font-medium">
              Could not load sites.
            </span>
            <RetryButton />
          </div>
        )}

        {empty && (
          <section className="rounded-[14px] bg-vz-surface p-4.5 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)] md:p-6">
            <h2
              className={`${SERIF} mb-2.5 text-[28px] leading-[1.15] font-normal tracking-[-0.015em]`}
            >
              No sites yet
            </h2>
            <p className="max-w-130 text-base leading-[1.6] text-pretty text-vz-ink-2">
              Add your first site to get a public site key. Then paste the
              install snippet into your app and real visits start to appear.
            </p>
          </section>
        )}

        {sites && sites.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {sites.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap justify-between gap-x-6 gap-y-2.5 rounded-xl bg-vz-surface p-4.5 shadow-[inset_0_0_0_1px_rgb(11_11_11/0.1)] md:p-6"
              >
                <div className="min-w-0 flex-[1_1_320px]">
                  <Link
                    href={`/app/sites/${s.id}`}
                    className={`inline-flex min-h-8 items-center text-lg font-medium tracking-[-0.01em] wrap-anywhere underline-offset-[3px] hover:text-vz-series ${FOCUS}`}
                  >
                    {s.name}
                  </Link>
                  <div className="mt-1.5 mb-2.5 flex flex-wrap items-center gap-1">
                    <code
                      className={`${MONO} min-w-0 text-[13px] wrap-anywhere text-vz-ink-2`}
                    >
                      {s.site_key}
                    </code>
                    <CopyButton
                      text={s.site_key}
                      ariaLabel={`Copy site key for ${s.name}`}
                      className={`min-h-11 min-w-11 cursor-pointer rounded-[7px] px-3 text-[13px] font-medium underline underline-offset-[3px] hover:bg-[#efeee9] ${FOCUS}`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.allowed_origins.map((o: string) => (
                      <span
                        key={o}
                        className={`${MONO} rounded-full bg-vz-page px-2.5 py-1 text-xs wrap-anywhere shadow-[inset_0_0_0_1px_rgb(11_11_11/0.14)]`}
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-[13px] whitespace-nowrap text-vz-ink-2">
                  Created {DATE.format(new Date(s.created_at))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SitesPanel>
    </>
  );
}
