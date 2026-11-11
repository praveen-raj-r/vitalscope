"use client";

import * as Sentry from "@sentry/nextjs";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { useEffect } from "react";
import { Logo } from "@/components/brand";
import { GITHUB_URL } from "@/lib/site-config";
import "./globals.css";

// This page replaces the root layout, so it loads its own copy of the fonts.
const serif = Newsreader({ subsets: ["latin"], weight: ["400"], variable: "--font-serif" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

/** Last-resort error page for errors in the root layout itself. It must render its own <html> and <body>. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col justify-center bg-vz-page px-5 font-sans text-vz-ink antialiased md:px-10">
        <div role="alert" className="mx-auto flex w-full max-w-130 flex-col items-start py-6 md:py-10">
          <div className="mb-9 flex items-center gap-2.5 text-[17px] font-medium tracking-[-0.01em]">
            <Logo />
            Vitalscope
          </div>
          <h1 className="mb-3.5 font-serif text-4xl leading-[1.08] font-normal tracking-[-0.02em] text-balance md:text-[56px]">
            Something went wrong
          </h1>
          <p className="mb-7 text-base leading-[1.6] text-pretty text-vz-ink-2">
            Vitalscope could not start. Reload the page to try again. If it keeps happening, check the project on
            GitHub.
          </p>
          <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-12 w-full cursor-pointer rounded-lg bg-vz-ink px-5.5 text-[15px] font-medium text-vz-surface hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-vz-series md:w-auto"
            >
              Reload page
            </button>
            <a
              href={GITHUB_URL}
              className="inline-flex min-h-11 items-center text-[15px] text-vz-ink focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vz-series"
            >
              GitHub
            </a>
          </div>
          <p className="mt-4.5 text-[13px] text-vz-ink-2">This error was reported.</p>
        </div>
      </body>
    </html>
  );
}
