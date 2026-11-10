import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold">Vitalscope</h1>
      <p className="mt-2 text-neutral-600">Real-user Core Web Vitals monitoring.</p>
      <Link className="mt-6 inline-block underline" href="/app">
        Open dashboard
      </Link>
    </main>
  );
}
