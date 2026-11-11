import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { FOCUS, SANS } from "@/lib/ui";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return (
    <div className={`min-h-screen bg-vz-page text-vz-ink ${SANS}`}>
      <header className="border-b border-vz-border bg-vz-surface">
        <div className="mx-auto flex h-16 max-w-240 items-center justify-between gap-3 px-5 md:px-10">
          <Link
            href="/app"
            className={`flex min-h-11 items-center gap-2.5 text-[17px] font-medium tracking-[-0.01em] no-underline ${FOCUS}`}
          >
            <Logo />
            Vitalscope
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <Link
              href="/demo"
              className={`flex min-h-11 items-center rounded-md px-3 text-[15px] text-vz-ink-2 no-underline hover:text-vz-ink ${FOCUS}`}
            >
              Demo
            </Link>
            <AccountMenu email={data.user.email ?? "your account"} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-240 px-5 pt-7 pb-18 md:px-10 md:pt-12">{children}</main>
    </div>
  );
}
