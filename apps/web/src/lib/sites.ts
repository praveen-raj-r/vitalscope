import { z } from "zod";

/** Parse a textarea (one origin per line or comma separated) into unique, normalised origins. */
export function parseOrigins(input: string): { origins: string[]; invalid: string[] } {
  const origins = new Set<string>();
  const invalid: string[] = [];
  for (const raw of input.split(/[\n,]/)) {
    const value = raw.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
      origins.add(url.origin);
    } catch {
      invalid.push(value);
    }
  }
  return { origins: [...origins], invalid };
}

export const createSiteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  origins: z.string(),
});

export function installSnippet(siteKey: string, endpoint: string): string {
  return `import { init } from '@vitalscope/sdk';\n\ninit({ siteKey: '${siteKey}', endpoint: '${endpoint}' });`;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
