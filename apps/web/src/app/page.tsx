import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_URL, NPM_PUBLISHED } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Vitalscope · Real-user Core Web Vitals monitoring",
  description:
    "A tiny open-source SDK and a dashboard that show how fast your pages are for real visitors: p75 LCP, INP and CLS, by page, device and release.",
};

const SNIPPET = `import { init } from '@vitalscope/sdk';

init({
  siteKey: 'vs_pub_your_site_key',
  release: '1.0.0', // optional: compare releases
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
    text: "Two releases side by side with the change in percent and the sample size, so you know when to trust it.",
  },
];

const STEPS = [
  {
    title: "Add the SDK",
    text: "One call to init() with your public site key. It reads the browser's own measurements through the web-vitals library.",
  },
  {
    title: "It reports once, when the visit ends",
    text: "Measurements are queued and sent in a single beacon when the page is hidden or closed, so it never competes with your page while it loads.",
  },
  {
    title: "Read the numbers",
    text: "The dashboard turns real visits into p75 values, trends, a histogram per page and a release comparison.",
  },
];

const PROMISES = [
  "No cookies, no IP addresses stored, no user ids and no full URLs with query strings.",
  "The size budget is under 5 KB gzipped including web-vitals, and CI fails if it is exceeded.",
  "It never throws on your page: every public function is wrapped, and it is silent unless debug is on.",
  "Sampling is decided once per visit, so a page view is either fully measured or not at all.",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-vz-ink">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold">Vitalscope</span>
        <nav aria-label="Main" className="flex gap-5 text-sm text-vz-ink-2">
          <Link href="/demo" className="underline hover:text-vz-ink">
            Demo
          </Link>
          <a href={GITHUB_URL} className="underline hover:text-vz-ink">
            GitHub
          </a>
          <Link href="/login" className="underline hover:text-vz-ink">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="mt-16">
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight">
          Real-user monitoring for Core Web Vitals
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-vz-ink-2">
          Lighthouse measures one run on one machine. Vitalscope shows what your real visitors experience: on their
          phones, on their networks, on every page, release after release.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo" className="rounded-md bg-vz-ink px-5 py-2.5 text-sm font-medium text-vz-surface">
            See the live demo
          </Link>
          <a href={GITHUB_URL} className="rounded-md border border-vz-axis px-5 py-2.5 text-sm font-medium hover:bg-vz-grid">
            View on GitHub
          </a>
        </div>
        <p className="mt-3 text-sm text-vz-ink-2">The demo runs on sample data and needs no sign-in.</p>
      </section>

      <section className="mt-20" aria-labelledby="questions">
        <h2 id="questions" className="text-2xl font-semibold">
          Three questions it answers
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {QUESTIONS.map((q) => (
            <li key={q.title} className="rounded-lg border border-vz-border bg-vz-surface p-5">
              <h3 className="font-medium">{q.title}</h3>
              <p className="mt-2 text-sm text-vz-ink-2">{q.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-vz-border bg-vz-surface p-5">
              <span className="text-sm text-vz-muted">Step {i + 1}</span>
              <h3 className="mt-1 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-vz-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20" aria-labelledby="install">
        <h2 id="install" className="text-2xl font-semibold">
          Install
        </h2>
        <p className="mt-2 text-vz-ink-2">
          Create a site in the dashboard to get your public site key, then add this to your app.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-vz-border bg-vz-surface p-4 text-sm">
          <code>{SNIPPET}</code>
        </pre>
        {!NPM_PUBLISHED && (
          <p role="note" className="mt-3 text-sm text-vz-ink-2">
            <strong className="text-vz-ink">Not published yet.</strong> The package is not on npm yet, so this snippet
            will not install today. The source is on GitHub.
          </p>
        )}
      </section>

      <section className="mt-20" aria-labelledby="promises">
        <h2 id="promises" className="text-2xl font-semibold">
          Built to stay out of the way
        </h2>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-vz-ink-2">
          {PROMISES.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-vz-grid pt-6 text-sm text-vz-ink-2">
        <span>Vitalscope is open source.</span>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/demo" className="underline hover:text-vz-ink">
            Demo
          </Link>
          <a href={GITHUB_URL} className="underline hover:text-vz-ink">
            GitHub
          </a>
        </nav>
      </footer>
    </main>
  );
}
