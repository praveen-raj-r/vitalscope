export interface PageRow {
  path: string;
  views: number;
  lcp_n: number;
  lcp_p75: number | null;
  inp_n: number;
  inp_p75: number | null;
  cls_n: number;
  cls_p75: number | null;
}

export type SortKey = "path" | "views" | "lcp" | "inp" | "cls";
export type SortDir = "asc" | "desc";

export const SORT_KEYS: readonly SortKey[] = ["path", "views", "lcp", "inp", "cls"];

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Default is the slowest LCP first, so the worst pages are at the top. */
export function parseSort(params: Params): { key: SortKey; dir: SortDir } {
  const key = first(params.sort);
  const dir = first(params.dir);
  return {
    key: (SORT_KEYS as readonly string[]).includes(key ?? "") ? (key as SortKey) : "lcp",
    dir: dir === "asc" || dir === "desc" ? dir : key === "path" ? "asc" : "desc",
  };
}

const VALUE: Record<Exclude<SortKey, "path">, (r: PageRow) => number | null> = {
  views: (r) => r.views,
  lcp: (r) => r.lcp_p75,
  inp: (r) => r.inp_p75,
  cls: (r) => r.cls_p75,
};

/** Returns a new array. Rows without a value for the sorted metric always go last. */
export function sortPages(rows: readonly PageRow[], key: SortKey, dir: SortDir): PageRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "path") return sign * a.path.localeCompare(b.path);
    const av = VALUE[key](a);
    const bv = VALUE[key](b);
    if (av === null && bv === null) return b.views - a.views;
    if (av === null) return 1;
    if (bv === null) return -1;
    return av === bv ? b.views - a.views : sign * (av - bv);
  });
}

/** The direction a column header link should switch to when clicked. */
export function nextDir(current: { key: SortKey; dir: SortDir }, key: SortKey): SortDir {
  if (current.key === key) return current.dir === "asc" ? "desc" : "asc";
  return key === "path" ? "asc" : "desc";
}
