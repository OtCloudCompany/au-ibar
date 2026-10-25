/**
 * AU-IBAR home page (25 Oct 2026): helpers that build the "Thematic areas" and "Resource type" cards from the
 * controlled vocabularies and the search index through the public REST API. Nothing about the themes, groups,
 * types or links is hard-coded: labels come from the vocabulary, counts and links from Discovery, and the
 * "see all" link from the browse index registered for the vocabulary.
 */

export interface VocabularyNode {
  id: string;
  label: string;
  note?: string;
}

export interface HomeCard {
  label: string;
  note?: string;
  count: number;
  /** query parameters of the search link, e.g. { 'f.itemtype': 'Policy brief,equals' } */
  params: Record<string, string>;
  icon: string;
}

async function getJson(api: string, path: string, params: Record<string, string | number> = {}): Promise<any> {
  const url = new URL(`${api}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`${res.status} ${path}`);
  }
  return res.json();
}

/** Top-level entries of a hierarchical vocabulary (themes, type groups). */
export async function topEntries(api: string, vocabulary: string): Promise<VocabularyNode[]> {
  const d = await getJson(api, 'submission/vocabularyEntryDetails/search/top', { vocabulary, size: 100 });
  return (d?._embedded?.vocabularyEntryDetails ?? []).map((e: any) => ({
    id: e.id, label: e.value, note: e.otherInformation?.note,
  }));
}

/** Labels of the children of a vocabulary entry (e.g. the types in a type group). */
export async function childLabels(api: string, entryId: string): Promise<string[]> {
  const d = await getJson(api, `submission/vocabularyEntryDetails/${encodeURIComponent(entryId)}/children`, { size: 200 });
  return (d?._embedded?.children ?? d?._embedded?.vocabularyEntryDetails ?? []).map((e: any) => e.value);
}

/** Number of items matching a Discovery query. */
export async function countItems(api: string, query: string): Promise<number> {
  const d = await getJson(api, 'discover/search/objects', { query, dsoType: 'ITEM', size: 1 });
  return d?._embedded?.searchResult?.page?.totalElements ?? 0;
}

/** Number of items matching a Discovery filter, e.g. ('auibartheme', 'Animal Health,contains'). */
export async function countFiltered(api: string, filter: string, value: string): Promise<number> {
  const d = await getJson(api, 'discover/search/objects', { [`f.${filter}`]: value, dsoType: 'ITEM', size: 1 });
  return d?._embedded?.searchResult?.page?.totalElements ?? 0;
}

/** Item counts per value of a Discovery facet (one request). */
export async function facetCounts(api: string, facet: string): Promise<Map<string, number>> {
  const d = await getJson(api, `discover/facets/${facet}`, { size: 500 });
  return new Map((d?._embedded?.values ?? []).map((v: any) => [v.label, v.count] as [string, number]));
}

/** Route of the browse index registered for a vocabulary, e.g. /browse/auibar-subjects. */
export async function browseRouteFor(api: string, vocabulary: string): Promise<string | null> {
  const d = await getJson(api, 'discover/browses', { size: 100 });
  const b = (d?._embedded?.browses ?? []).find((x: any) => x.vocabulary === vocabulary);
  return b ? `/browse/${b.id}` : null;
}

/** Escape a value for use as a Solr/Lucene term. */
export function escapeTerm(s: string): string {
  return s.replace(/([+\-!(){}[\]^"~*?:\\/&|,\s])/g, '\\$1');
}

/** Quote a value for use as a Solr phrase. */
export function phrase(s: string): string {
  return `"${s.replace(/(["\\])/g, '\\$1')}"`;
}

/** Font Awesome icon chosen from words in a label (presentation only). */
export function iconFor(label: string, fallback = 'fa-layer-group'): string {
  const rules: [RegExp, string][] = [
    [/welfare/i, 'fa-paw'], [/health|disease|veterinar/i, 'fa-stethoscope'], [/fisher|aquacult|fish/i, 'fa-fish'],
    [/biodiversity|aquatic|blue|water|marine/i, 'fa-water'], [/production|livestock|feed|genetic/i, 'fa-cow'],
    [/econom|trade|market|invest/i, 'fa-chart-line'], [/data|statistic|information/i, 'fa-database'],
    [/knowledge|learning|capacity|training/i, 'fa-graduation-cap'], [/research|technical/i, 'fa-flask'],
    [/policy|strateg|legal|governance/i, 'fa-scale-balanced'], [/programme|project/i, 'fa-diagram-project'],
    [/meeting|event/i, 'fa-people-group'], [/communication|outreach|news/i, 'fa-bullhorn'],
    [/multimedia|video|audio|photo/i, 'fa-photo-film'], [/institutional|corporate/i, 'fa-building-columns'],
    [/practice|guid|manual/i, 'fa-book-open'],
  ];
  const hit = rules.find(([re]) => re.test(label));
  return hit ? hit[1] : fallback;
}

/** Browser cache for the home-page cards (per visitor, 30 minutes); every access is guarded. */
const CACHE_MS = 30 * 60 * 1000;

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`auibar-home:${key}`);
    if (!raw) {
      return null;
    }
    const { at, data } = JSON.parse(raw);
    return Date.now() - at < CACHE_MS ? data as T : null;
  } catch (e) {
    return null;
  }
}

export function writeCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(`auibar-home:${key}`, JSON.stringify({ at: Date.now(), data }));
  } catch (e) {
    // storage unavailable (private window, quota): cards still load from the API
  }
}
