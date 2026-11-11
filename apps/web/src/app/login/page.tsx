import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { FOCUS, SANS, SERIF } from "@/lib/ui";
import { SignInButton } from "./sign-in-button";

export const metadata: Metadata = { title: "Sign in · Vitalscope" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/app");

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center gap-5 bg-vz-page px-6 py-6 text-vz-ink ${SANS}`}>
      <div className="w-full max-w-[400px] rounded-2xl bg-vz-surface p-6 shadow-[0_0_0_1px_rgba(11,11,11,0.10),0_24px_48px_-28px_rgba(11,11,11,0.22)] md:p-9">
        <div className="flex items-center gap-2.5 text-base font-medium tracking-tight">
          <Logo />
          Vitalscope
        </div>
        <h1 className={`mb-3 mt-7 text-4xl leading-[1.1] tracking-[-0.02em] ${SERIF}`}>Sign in</h1>
        <p className="mb-6 text-pretty text-[15px] leading-[1.55] text-vz-ink-2">
          Read-only access to your GitHub profile. No passwords stored.
        </p>
        <SignInButton failed={error !== undefined} />
        <div className="mt-5 flex justify-center border-t border-vz-border pt-4">
          <Link href="/demo" className={`flex min-h-11 items-center text-[15px] font-medium ${FOCUS}`}>
            Look around first →
          </Link>
        </div>
      </div>
      <Link href="/" className={`flex min-h-11 items-center text-sm text-vz-ink-2 hover:text-vz-ink ${FOCUS}`}>
        ← Back to Vitalscope
      </Link>
    </main>
  );
}
