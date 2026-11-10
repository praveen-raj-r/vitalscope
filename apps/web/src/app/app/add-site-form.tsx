"use client";

import { useActionState } from "react";
import { createSite, type CreateSiteState } from "./actions";
import { installSnippet } from "@/lib/sites";

export function AddSiteForm({ endpoint }: { endpoint: string }) {
  const [state, action, pending] = useActionState<CreateSiteState, FormData>(createSite, {});
  return (
    <section>
      <form action={action} className="space-y-3">
        <label className="block text-sm">
          Name
          <input name="name" required maxLength={100} className="mt-1 block w-full rounded border p-2" />
        </label>
        <label className="block text-sm">
          Allowed origins (one per line)
          <textarea
            name="origins"
            required
            placeholder="https://example.com"
            className="mt-1 block w-full rounded border p-2"
          />
        </label>
        <button disabled={pending} className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50">
          {pending ? "Adding..." : "Add site"}
        </button>
        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      </form>
      {state.site && (
        <div className="mt-6 rounded border p-4">
          <p className="text-sm">
            <strong>{state.site.name}</strong> created. Your site key (public):
          </p>
          <code className="mt-1 block break-all">{state.site.siteKey}</code>
          <pre className="mt-3 overflow-x-auto rounded bg-neutral-100 p-3 text-xs">
            {installSnippet(state.site.siteKey, endpoint)}
          </pre>
        </div>
      )}
    </section>
  );
}
