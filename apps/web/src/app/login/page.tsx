import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { CARD, FOCUS, MONO, SANS, SERIF } from "@/lib/ui";
import { SignInButton } from "./sign-in-button";

export const metadata: Metadata = { title: "Sign in · Vitalscope" };

/** What the product answers, in the same three questions the README opens with. */
const POINTS = [
  {
    title: "How fast is my site, really?",
    text: "The 75th-percentile LCP, INP and CLS from real visitors, rated good, needs improvement or poor.",
  },
  {
    title: "Which pages and devices are slow?",
    text: "Pages ranked worst first, with the slow element or interaction behind each number.",
  },
  {
    title: "Did the last release help?",
    text: "Two releases side by side, with the change and the sample size.",
  },
] as const;

/**
 * Illustrative values only, labelled as a sample on the page. The shape (◆ ▲ ●) and the word carry each rating,
 * so colour is never the only signal.
 */
const SAMPLE = [
  {
    metric: "LCP",
    value: "2.1 s",
    rating: "Good",
    color: "var(--color-vz-good)",
    shape: "●",
  },
  {
    metric: "INP",
    value: "310 ms",
    rating: "Needs improvement",
    color: "var(--color-vz-warn)",
    shape: "▲",
  },
  {
    metric: "CLS",
    value: "0.31",
    rating: "Poor",
    color: "var(--color-vz-bad)",
    shape: "◆",
  },
] as const;

/**
 * Decorative background: a dotted grid, measurement rings, a faint histogram and a pulse line, all in the
 * app's own colours at low opacity. Hidden from assistive tech and never intercepts clicks.
 */
function Backdrop() {
  const bars = [14, 26, 44, 62, 78, 90, 70, 52, 36, 24, 16, 10, 7, 5];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="login-dots"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1" fill="var(--color-vz-axis)" />
          </pattern>
          <radialGradient id="login-fade" cx="50%" cy="45%" r="70%">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity="1" />
          </radialGradient>
          <mask id="login-mask">
            <rect width="100%" height="100%" fill="url(#login-fade)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#login-dots)"
          opacity="0.55"
          mask="url(#login-mask)"
        />
      </svg>

      {/* Rings, like the logo, top right */}
      <svg
        viewBox="0 0 400 400"
        className="absolute -top-24 -right-24 w-90 md:-top-32 md:-right-32 md:w-130"
        fill="none"
      >
        {[190, 150, 110, 70].map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            stroke="var(--color-vz-series)"
            strokeOpacity={0.14 - i * 0.02}
          />
        ))}
        <circle
          cx="200"
          cy="200"
          r="3.5"
          fill="var(--color-vz-series)"
          fillOpacity="0.35"
        />
      </svg>

      {/* Histogram silhouette, bottom right, away from the text: good, needs improvement, poor */}
      <svg
        viewBox="0 0 280 100"
        className="absolute right-0 bottom-0 h-24 w-75 md:right-10 md:h-32 md:w-110"
        preserveAspectRatio="none"
      >
        {bars.map((h, i) => (
          <rect
            key={i}
            x={i * 20 + 2}
            y={100 - h}
            width="16"
            height={h}
            rx="2"
            fill={
              i < 7
                ? "var(--color-vz-good)"
                : i < 10
                  ? "var(--color-vz-warn)"
                  : "var(--color-vz-bad)"
            }
            fillOpacity="0.13"
          />
        ))}
      </svg>

      {/* Pulse line along the bottom edge, with a fixed height so its spikes stay small and never cross the content */}
      <svg
        viewBox="0 0 1200 200"
        className="absolute right-0 bottom-3 h-16 w-full min-w-225 md:h-20"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          className="pulse-draw"
          pathLength={1}
          d="M0 110 H380 L420 110 L452 60 L500 170 L548 40 L590 110 H760 L790 90 L820 125 L850 110 H1200"
          stroke="var(--color-vz-series)"
          strokeOpacity="0.28"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/app");

  return (
    <main
      className={`relative flex min-h-screen flex-col overflow-hidden bg-vz-page px-6 py-6 text-vz-ink md:px-10 ${SANS}`}
    >
      <Backdrop />
      {/* The logo sits in its own row, so the two columns below start at the same height. */}
      <header className="relative mx-auto w-full max-w-280">
        <Link
          href="/"
          className={`inline-flex min-h-11 items-center gap-2.5 text-base font-medium tracking-tight no-underline ${FOCUS}`}
        >
          <Logo />
          Vitalscope
        </Link>
      </header>
      <div className="relative mx-auto my-auto flex w-full max-w-280 flex-col gap-10 pt-8 pb-24 md:flex-row md:items-start md:justify-between md:gap-16 md:pt-12 md:pb-28">
        {/* What Vitalscope is */}
        <section
          aria-labelledby="about-heading"
          className="max-w-140 flex-1 md:order-first"
        >
          <p
            className={`${MONO} text-[12px] font-medium tracking-[0.08em] text-vz-ink-2 uppercase`}
          >
            Real-user monitoring for Core Web Vitals
          </p>
          <h2
            id="about-heading"
            className={`${SERIF} mt-2 mb-4 text-[34px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[44px]`}
          >
            See how fast your site is for the people who use it.
          </h2>
          <p className="mb-7 max-w-120 text-pretty text-[15px] leading-[1.6] text-vz-ink-2">
            A tiny SDK, under 5 KB, measures real visitors. This dashboard turns
            it into p75 numbers by page, device and release.
          </p>

          <ul className="mb-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="8"
                    fill="none"
                    stroke="var(--color-vz-axis)"
                  />
                  <path
                    d="M5.5 9.3l2.4 2.4 4.6-5"
                    fill="none"
                    stroke="var(--color-vz-series)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <h3 className="text-[15px] leading-[1.35] font-semibold">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-normal text-vz-ink-2">
                    {p.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* A small picture of what the dashboard shows */}
          <div
            className={`${CARD} p-4`}
            role="group"
            aria-label="Sample dashboard numbers, not real data"
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-vz-ink-2">
                p75, last 7 days
              </span>
              <span className="text-xs text-vz-muted">Sample data</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE.map((s) => (
                <div key={s.metric}>
                  <div className={`${MONO} text-[12px] text-vz-ink-2`}>
                    {s.metric}
                  </div>
                  <div
                    className={`${SERIF} text-[26px] leading-[1.15] tabular-nums`}
                  >
                    {s.value}
                  </div>
                  <div className="mt-0.5 flex items-start gap-1 text-[12px] leading-tight text-vz-ink-2">
                    <span aria-hidden="true" style={{ color: s.color }}>
                      {s.shape}
                    </span>
                    {s.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sign in */}
        <section
          aria-labelledby="signin-heading"
          className="order-first w-full md:order-last md:w-95 md:shrink-0"
        >
          <div className="rounded-2xl bg-vz-surface p-6 shadow-[0_0_0_1px_rgba(11,11,11,0.10),0_24px_48px_-28px_rgba(11,11,11,0.22)] md:p-9">
            <h1
              id="signin-heading"
              className={`mb-3 text-4xl leading-[1.1] tracking-[-0.02em] ${SERIF}`}
            >
              Sign in
            </h1>
            <p className="mb-6 text-pretty text-[15px] leading-[1.55] text-vz-ink-2">
              Read-only access to your GitHub profile. No passwords stored.
            </p>
            <SignInButton failed={error !== undefined} />
            <div className="mt-5 flex justify-center border-t border-vz-border pt-4">
              <Link
                href="/demo"
                className={`flex min-h-11 items-center text-[15px] font-medium ${FOCUS}`}
              >
                Look around Demo First
              </Link>
            </div>
          </div>
          <p className="mt-4 text-center text-[13px] leading-normal text-vz-muted">
            No cookies or IP addresses are collected from your visitors.
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className={`flex min-h-11 items-center text-sm text-vz-ink-2 hover:text-vz-ink ${FOCUS}`}
            >
              ← Back to Vitalscope
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
