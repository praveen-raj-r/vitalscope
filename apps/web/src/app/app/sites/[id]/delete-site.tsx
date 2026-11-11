"use client";

import { useActionState } from "react";
import { deleteSite, type DeleteSiteState } from "@/app/app/actions";

export function DeleteSite({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<DeleteSiteState, FormData>(deleteSite, {});
  return (
    <details className="mt-12 rounded border border-red-200 p-4">
      <summary className="cursor-pointer text-sm font-medium text-red-700">Delete this site</summary>
      <form action={action} className="mt-3 space-y-3">
        <p className="text-sm">
          This permanently deletes <strong>{name}</strong>, all of its events and its daily rollups. Its site key stops
          working immediately. This cannot be undone.
        </p>
        <input type="hidden" name="id" value={id} />
        <label className="block text-sm">
          Type the site name to confirm
          <input name="confirm" required autoComplete="off" className="mt-1 block w-full rounded border p-2" />
        </label>
        <button disabled={pending} className="rounded bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">
          {pending ? "Deleting..." : "Delete site permanently"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </form>
    </details>
  );
}
