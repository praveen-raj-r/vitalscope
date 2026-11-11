import { NotFoundCard } from "@/components/not-found-card";

/** 404 inside the signed-in app (for example a site that does not exist or belongs to someone else). */
export default function AppNotFound() {
  return <NotFoundCard href="/app" label="Back to my sites" />;
}
