import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <span className="font-semibold">Vitalscope</span>
        <form action="/auth/signout" method="post">
          <button className="text-sm underline">Sign out ({data.user.email})</button>
        </form>
      </header>
      {children}
    </div>
  );
}
