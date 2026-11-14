import type { Metadata } from "next";
import Link from "next/link";
import { GitHubMark, Logo } from "@/components/brand";
import { CopyButton } from "@/components/copy-button";
import { InstallCommand } from "@/components/install-command";
import { GITHUB_URL, NPM_PUBLISHED } from "@/lib/site-config";
import { FOCUS, MONO, SANS, SERIF } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Vitalscope · Real-user Core Web Vitals monitoring",
  description:
    "A tiny open-source SDK and a dashboard that show how fast your pages are for real visitors: p75 LCP, INP and CLS, by page, device and release.",
};

const SNIPPET = `import { init } from '@praveen-raj/vitalscope';
init({
  siteKey: 'vs_pub_your_site_key', release: '1.0.0'
});`;

const QUESTIONS = [
  {
    title: "How fast is my site, really?",
    text: "The 75th-percentile LCP, INP and CLS for your site right now, rated good, needs improvement or poor.",
  },
  {
    title: "Which pages and devices are slow?",
    text: "A table of pages, worst first, and for each page the slow element or interaction behind the numbers.",
  },
  {
    title: "Did the last release help?",
    text: "Two releases side by side, with the change in percent and the sample size, so you know when to trust it.",
  },
];

const STEPS = [
  {
    title: "Add your site",
    text: "Sign in with GitHub, name your site and list the origins allowed to report, such as https://example.com. Copy the public site key.",
  },
  {
    title: "Install the SDK",
    text: "Run npm install, then call init once in your app with the site key and your release. It is one call, and it never throws.",
    href: "#install",
    link: "See the code",
  },
  {
    title: "Visit your site",
    text: "Open it, use it a little, then leave the page. Measurements are sent when a page is hidden, not while it loads.",
  },
  {
    title: "Read the dashboard",
    text: "Overview, pages, page detail and releases, with filters for time range, device and release. Lower is better for all three.",
    href: "/demo",
    link: "Try the demo",
  },
];

const PROMISES = [
  {
    title: "Under 5 KB gzipped",
    text: "Including web-vitals. CI fails if the size budget is exceeded.",
  },
  {
    title: "Never throws",
    text: "Every public function is wrapped, and it is silent unless debug is on.",
  },
  {
    title: "No cookies",
    text: "No IP addresses stored, no user ids and no full URLs with query strings.",
  },
  {
    title: "Sends when the page is hidden",
    text: "Measurements are queued and sent in a single beacon, so it never competes with your page while it loads.",
  },
];

/** Illustrative numbers for the hero card. They are labelled "Illustrative" and are not real data. */
const PREVIEW = [
  { metric: "LCP", value: "2.1 s", rating: "good" as const, label: "Good" },
  {
    metric: "INP",
    value: "340 ms",
    rating: "needs-improvement" as const,
    label: "Needs improvement",
  },
  { metric: "CLS", value: "0.31", rating: "poor" as const, label: "Poor" },
];

function RatingIcon({
  rating,
}: {
  rating: "good" | "needs-improvement" | "poor";
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="shrink-0"
    >
      {rating === "good" && (
        <>
          <circle cx="7" cy="7" r="7" fill="var(--color-vz-good)" />
          <path
            d="M4 7.2l2 2L10 5"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {rating === "needs-improvement" && (
        <>
          <path d="M7 .8L13.4 12.6H.6z" fill="var(--color-vz-warn)" />
          <path
            d="M7 5.2v3.4M7 10.2v.1"
            stroke="#0b0b0b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
      {rating === "poor" && (
        <>
          <rect
            x="1"
            y="1"
            width="12"
            height="12"
            rx="2.5"
            fill="var(--color-vz-bad)"
            transform="rotate(45 7 7) scale(.86) translate(1 1)"
          />
          <path
            d="M5 5l4 4M9 5l-4 4"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function NavLink({
  href,
  children,
  strong = false,
}: {
  href: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  const cls = `flex min-h-11 items-center px-2.5 md:px-3 ${FOCUS} ${strong ? "font-medium text-vz-ink" : "text-vz-ink-2 hover:text-vz-ink"}`;
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <div
      className={`min-h-screen bg-vz-page text-vz-ink ${SANS}`}
    >
      <main className="mx-auto max-w-270 px-5 md:px-8 lg:px-0">
        <header className="flex min-h-16 items-center justify-between md:h-21">
          <Link
            href="/"
            className={`flex min-h-11 items-center gap-2 text-base font-medium tracking-tight md:gap-2.5 md:text-[17px] ${FOCUS}`}
          >
            <Logo />
            Vitalscope
          </Link>
          <nav aria-label="Main" className="flex text-sm md:text-[15px]">
            <NavLink href="/demo">Demo</NavLink>
            <NavLink href={GITHUB_URL}>GitHub</NavLink>
            <NavLink href="/login" strong>
              Sign in
            </NavLink>
          </nav>
        </header>

        <section className="grid items-center gap-9 pb-14 pt-10 md:pb-24 md:pt-18 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-18 lg:pb-26">
          <div>
            <p
              className={`mb-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-vz-ink-2 md:mb-5 md:text-xs ${MONO}`}
            >
              Real-user monitoring · Core Web Vitals
            </p>
            <h1
              className={`text-balance text-[40px] leading-[1.06] tracking-[-0.02em] md:text-6xl md:leading-[1.04] ${SERIF}`}
            >
              Real-user monitoring for Core Web Vitals
            </h1>
            <p className="mt-4.5 max-w-130 text-pretty text-base leading-[1.55] text-vz-ink-2 md:mt-6 md:text-[19px]">
              Lighthouse measures one run on one machine. Vitalscope shows what
              your real visitors experience: on their phones, on their networks,
              on every page, release after release.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 md:mt-9">
              <Link
                href="/demo"
                className="flex min-h-12 items-center justify-center rounded-lg bg-vz-ink px-5.5 text-[15px] font-medium text-vz-surface transition-colors hover:bg-[#2b2a28] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-vz-series"
              >
                View live demo
              </Link>
              <Link
                href="/login"
                className="flex min-h-12 items-center justify-center gap-2.5 rounded-lg bg-vz-surface px-5.5 text-[15px] font-medium text-vz-ink shadow-[inset_0_0_0_1px_rgba(11,11,11,0.22)] hover:bg-[#f1f0ec] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-vz-series"
              >
                <GitHubMark />
                Sign in with GitHub
              </Link>
            </div>
            <p className="mt-3.5 text-[13px] text-vz-ink-2 md:mt-4 md:text-sm">
              The demo runs on sample data and needs no sign-in.
            </p>
          </div>

          <div
            role="img"
            aria-label="Illustrative dashboard preview: LCP 2.1 seconds good, INP 340 milliseconds needs improvement, CLS 0.31 poor"
            className="rounded-[14px] bg-vz-surface p-3.5 shadow-[0_0_0_1px_rgba(11,11,11,0.10),0_18px_40px_-20px_rgba(11,11,11,0.18)] md:p-5"
          >
            <div className="mb-2.5 flex items-baseline justify-between text-xs text-vz-ink-2 md:mb-3.5 md:text-[13px]">
              <span className="font-medium text-vz-ink">p75 · last 7 days</span>
              <span className={`text-xs ${MONO}`}>Illustrative</span>
            </div>
            <div className="flex flex-col gap-2 md:gap-2.5">
              {PREVIEW.map((p) => (
                <div
                  key={p.metric}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-[10px] bg-vz-page px-3 py-3 shadow-[inset_0_0_0_1px_rgba(11,11,11,0.08)] md:px-4 md:py-3.5"
                >
                  <div>
                    <div
                      className={`text-[11px] font-medium tracking-[0.06em] text-vz-ink-2 md:text-xs ${MONO}`}
                    >
                      {p.metric}
                    </div>
                    <div
                      className={`mt-0.5 text-[28px] leading-[1.1] tabular-nums md:mt-1 md:text-[34px] ${SERIF}`}
                    >
                      {p.value}
                    </div>
                    <div
                      className={`mt-0.5 text-xs text-vz-ink-2 md:mt-1 ${MONO}`}
                    >
                      8,412 samples
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-vz-surface py-1.25 pl-2 pr-2.5 text-xs font-medium shadow-[inset_0_0_0_1px_rgba(11,11,11,0.14)] md:text-[13px]">
                    <RatingIcon rating={p.rating} />
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="questions"
          className="border-t border-vz-border py-12 md:pb-24 md:pt-22"
        >
          <h2
            id="questions"
            className={`mb-5 text-[28px] leading-[1.12] tracking-[-0.015em] md:mb-9 md:text-4xl md:leading-[1.1] ${SERIF}`}
          >
            Three questions it answers
          </h2>
          <ol className="grid border-t border-vz-ink md:grid-cols-3">
            {QUESTIONS.map((q, i) => (
              <li
                key={q.title}
                className="border-b border-vz-border py-4.5 md:border-b-0 md:pb-2 md:pl-0 md:pr-7 md:pt-6"
              >
                <div
                  className={`text-[11px] font-medium text-vz-ink-2 md:text-xs ${MONO}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-1.5 mt-2 text-[17px] font-medium leading-[1.3] tracking-tight md:mb-2.5 md:mt-3 md:text-[19px]">
                  {q.title}
                </h3>
                <p className="text-pretty text-[15px] leading-[1.6] text-vz-ink-2">
                  {q.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="how-to-use"
          className="border-t border-vz-border py-12 md:pb-24 md:pt-22"
        >
          <h2
            id="how-to-use"
            className={`mb-2.5 text-[28px] leading-[1.12] tracking-[-0.015em] md:mb-3 md:text-4xl md:leading-[1.1] ${SERIF}`}
          >
            How to use it
          </h2>
          <p className="mb-5 max-w-130 text-pretty text-[15px] leading-[1.6] text-vz-ink-2 md:mb-9 md:text-base">
            From nothing to your first numbers in four steps.
          </p>
          <ol className="grid border-t border-vz-ink md:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="border-b border-vz-border py-4.5 md:border-b-0 md:pb-2 md:pl-0 md:pr-6 md:pt-6"
              >
                <div
                  className={`text-[11px] font-medium text-vz-ink-2 md:text-xs ${MONO}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-1.5 mt-2 text-[17px] font-medium leading-[1.3] tracking-tight md:mb-2.5 md:mt-3 md:text-[19px]">
                  {step.title}
                </h3>
                <p className="text-pretty text-[15px] leading-[1.6] text-vz-ink-2">
                  {step.text}
                </p>
                {step.href && (
                  <Link
                    href={step.href}
                    className={`mt-2 inline-flex min-h-11 items-center text-[15px] font-medium text-vz-ink underline underline-offset-[3px] hover:text-vz-series ${FOCUS}`}
                  >
                    {step.link} →
                  </Link>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-pretty text-sm leading-[1.6] text-vz-ink-2 md:mt-7">
            Not seeing data? Check that the page&apos;s origin matches an
            allowed origin exactly, and that you left or hid the page once. The{" "}
            <a
              href={`${GITHUB_URL}#not-seeing-data`}
              className={`font-medium text-vz-ink underline underline-offset-[3px] hover:text-vz-series ${FOCUS}`}
            >
              troubleshooting list
            </a>{" "}
            has the rest.
          </p>
        </section>

        <section
          aria-labelledby="install"
          className="grid gap-4 border-t border-vz-border py-12 md:pb-24 md:pt-22 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16"
        >
          <div>
            <h2
              id="install"
              className={`mb-2.5 text-[28px] leading-[1.12] tracking-[-0.015em] md:mb-4 md:text-4xl md:leading-[1.1] ${SERIF}`}
            >
              Install
            </h2>
            <p className="text-pretty text-[15px] leading-[1.6] text-vz-ink-2 md:text-base">
              Create a site in the dashboard to get your public site key, then
              add this to your app.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 md:gap-3.5">
            <InstallCommand />
            <div className="overflow-hidden rounded-xl bg-vz-ink text-[#f1f0ec]">
              <div
                className={`flex items-center justify-between pl-4 pr-1 pt-1 text-xs font-medium text-[#9d9b93] md:pl-7 md:pt-2 ${MONO}`}
              >
                <span>app.ts</span>
                <CopyButton
                  text={SNIPPET}
                  ariaLabel="Copy code snippet"
                  className="min-h-11 min-w-11 rounded-[7px] px-3 font-sans text-[13px] font-medium text-vz-surface hover:bg-white/15 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
                />
              </div>
              <pre
                className={`overflow-auto whitespace-pre-wrap wrap-anywhere px-4 pb-5 pt-1.5 text-[12.5px] leading-[1.75] md:px-7 md:pb-6 md:text-[15px] ${MONO}`}
              >
                <code>
                  <span className="text-[#9d9b93]">import</span> {"{ init }"}{" "}
                  <span className="text-[#9d9b93]">from</span>{" "}
                  <span className="text-[#8ec0ff]">
                    &apos;@praveen-raj/vitalscope&apos;
                  </span>
                  ;{"\n"}
                  init({"{"}
                  {"\n"}
                  {"  siteKey: "}
                  <span className="text-[#8ec0ff]">
                    &apos;vs_pub_your_site_key&apos;
                  </span>
                  {", release: "}
                  <span className="text-[#8ec0ff]">&apos;1.0.0&apos;</span>
                  {"\n"}
                  {"}"});
                </code>
              </pre>
            </div>
            {!NPM_PUBLISHED && (
              <p role="note" className="text-sm text-vz-ink-2">
                <strong className="text-vz-ink">Not published yet.</strong> The
                package is not on npm yet, so this snippet will not install
                today. The source is on GitHub.
              </p>
            )}
          </div>
        </section>

        <section
          aria-labelledby="promises"
          className="grid gap-6 border-t border-vz-border py-12 md:pb-24 md:pt-22 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16"
        >
          <h2
            id="promises"
            className={`text-[28px] leading-[1.12] tracking-[-0.015em] md:text-4xl md:leading-[1.1] ${SERIF}`}
          >
            Built to stay out of the way
          </h2>
          <ul className="grid gap-5.5 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
            {PROMISES.map((p) => (
              <li key={p.title}>
                <div
                  className={`text-2xl leading-[1.1] tracking-[-0.01em] md:text-[30px] ${SERIF}`}
                >
                  {p.title}
                </div>
                <p className="mt-1.5 text-pretty text-[15px] leading-[1.6] text-vz-ink-2 md:mt-2">
                  {p.text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="flex min-h-18 items-center justify-between border-t border-vz-border text-[13px] text-vz-ink-2 md:min-h-22 md:text-sm">
          <span>Vitalscope · MIT licence</span>
          <nav aria-label="Footer" className="flex">
            <NavLink href="/demo">Demo</NavLink>
            <NavLink href={GITHUB_URL}>GitHub</NavLink>
          </nav>
        </footer>
      </main>
    </div>
  );
}
