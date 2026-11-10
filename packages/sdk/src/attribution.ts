import type { Metric } from "web-vitals";
import { clip, stripQuery } from "./util";

// Minimal shapes of the browser entries we read (not all are in lib.dom for every TS version).
interface LcpEntry { element?: Element | null; url?: string }
interface EventEntry { name: string; duration: number; target?: Node | null; targetSelector?: string }
interface Shift { value: number; sources?: { node?: Node | null; currentRect: DOMRectReadOnly }[] }

/** Short CSS-like path: stops at an id, at most 4 levels, e.g. `main > div.hero > img`. */
export function selectorOf(node: Node | null | undefined): string | undefined {
  if (!node || node.nodeType !== 1) return undefined;
  const parts: string[] = [];
  let el: Element | null = node as Element;
  for (let depth = 0; el && depth < 4; depth++, el = el.parentElement) {
    const tag = el.localName;
    if (el.id) {
      parts.unshift(`${tag}#${el.id}`);
      break;
    }
    const cls = (el.getAttribute("class") ?? "").trim().split(/\s+/)[0];
    parts.unshift(cls ? `${tag}.${cls}` : tag);
  }
  return clip(parts.join(" > "));
}

/**
 * Attribution built from metric.entries so we can use the small plain web-vitals build.
 * Strings are clipped to 200 chars; resource URLs lose query and hash; data: URLs are dropped.
 */
export function pickAttribution(metric: Metric): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  const put = (key: string, value: string | undefined) => {
    if (value) out[key] = clip(value);
  };
  const entries = metric.entries as unknown[];

  if (metric.name === "LCP") {
    const last = entries[entries.length - 1] as LcpEntry | undefined;
    put("target", selectorOf(last?.element));
    if (last?.url && !last.url.startsWith("data:")) put("url", stripQuery(last.url));
  } else if (metric.name === "INP") {
    // Some events of one interaction (e.g. pointerup) have no target node, so the target comes from
    // the slowest entry that has one, while the event type comes from the slowest entry overall.
    let slowest: EventEntry | undefined;
    let slowestWithTarget: EventEntry | undefined;
    for (const e of entries as EventEntry[]) {
      if (!slowest || e.duration > slowest.duration) slowest = e;
      if (e.target && (!slowestWithTarget || e.duration > slowestWithTarget.duration)) slowestWithTarget = e;
    }
    put("target", selectorOf(slowestWithTarget?.target) ?? (entries as EventEntry[]).find((e) => e.targetSelector)?.targetSelector);
    put("eventType", slowest?.name);
  } else if (metric.name === "CLS") {
    let worst: Shift | undefined;
    for (const e of entries as Shift[]) if (!worst || e.value > worst.value) worst = e;
    let area = -1;
    let node: Node | null | undefined;
    for (const s of worst?.sources ?? []) {
      const a = s.currentRect.width * s.currentRect.height;
      if (a > area) {
        area = a;
        node = s.node;
      }
    }
    put("target", selectorOf(node));
  }
  return Object.keys(out).length ? out : undefined;
}
