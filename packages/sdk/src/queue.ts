import type { Report } from "./types";

export const MAX_PAYLOAD_BYTES = 16 * 1024;

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : undefined;

function byteLength(text: string): number {
  return encoder ? encoder.encode(text).length : text.length * 3; // worst case for UTF-8
}

export interface Built {
  body: string;
  /** How many reports from the front of the list went into `body`. */
  taken: number;
}

/**
 * Build one payload of at most `maxBytes`. Reports that do not fit stay for the next flush.
 * A single report larger than the cap can never be sent, so it is dropped (counted in `taken`).
 */
export function buildPayload(siteKey: string, reports: Report[], maxBytes = MAX_PAYLOAD_BYTES): Built | null {
  const included: Report[] = [];
  let taken = 0;
  for (const report of reports) {
    const candidate = JSON.stringify({ siteKey, reports: [...included, report] });
    if (byteLength(candidate) > maxBytes) {
      if (included.length === 0) {
        taken++; // oversized on its own: drop it and look at the next one
        continue;
      }
      break;
    }
    included.push(report);
    taken++;
  }
  if (included.length === 0) return null;
  return { body: JSON.stringify({ siteKey, reports: included }), taken };
}

export class ReportQueue {
  private items: Report[] = [];

  /** The latest report of a metric replaces an unsent earlier one (e.g. CLS updates). */
  add(report: Report): void {
    const i = this.items.findIndex((r) => r.metric === report.metric);
    if (i >= 0) this.items[i] = report;
    else this.items.push(report);
  }

  get size(): number {
    return this.items.length;
  }

  /** Take at most one payload worth of reports; the rest stay queued. */
  flush(siteKey: string): string | null {
    if (this.items.length === 0) return null;
    const built = buildPayload(siteKey, this.items);
    if (!built) {
      this.items = [];
      return null;
    }
    this.items = this.items.slice(built.taken);
    return built.body;
  }
}
