"use client";

import { createClient } from "@/lib/supabase/client";

export function SignInButton() {
  async function signIn() {
    await createClient().auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }
  return (
    <button onClick={signIn} className="rounded bg-neutral-900 px-4 py-2 text-white">
      Continue with GitHub
    </button>
  );
}
