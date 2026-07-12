import { create, getByID, load, search } from "@orama/orama";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import { RemoteError } from "./errors.mjs";

export const SEARCH_SCHEMA = {
  content: "string",
  page_id: "string",
  type: "string",
  tags: "enum[]",
  url: "string",
  embeddings: "vector[512]",
};

const MAX_SNIPPET_LENGTH = 299;

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeForMatch(value) {
  return normalizeText(value).toLocaleLowerCase();
}

function recordsFromDump(dump) {
  return Object.values(dump?.docs?.docs ?? {});
}

function pageRecords(records) {
  const pages = new Map();
  for (const record of records) {
    const pageId = String(record.page_id ?? "");
    if (!pageId) continue;
    const entry = pages.get(pageId) ?? { page: undefined, records: [] };
    if (record.type === "page") entry.page = record;
    else entry.records.push(record);
    pages.set(pageId, entry);
  }
  return pages;
}

function descriptionFor(entry) {
  return normalizeText(entry.records.find((record) => record.type === "text" && record.url === entry.page.url)?.content ?? "");
}

function relevantText(entry, query) {
  const allTexts = entry.records.filter((record) => record.type === "text" && record.content);
  const descriptionRecord = allTexts.find((record) => record.url === entry.page.url);
  const contentTexts = allTexts.filter((record) => record !== descriptionRecord);
  const texts = contentTexts.length > 0 ? contentTexts : allTexts;
  const normalizedQuery = normalizeForMatch(query);
  const exact = texts.find((record) => normalizeForMatch(record.content).includes(normalizedQuery));
  if (exact) return exact.content;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  let best = "";
  let bestScore = 0;
  for (const record of texts) {
    const text = normalizeForMatch(record.content);
    const score = terms.reduce((total, term) => total + (text.includes(term) ? term.length : 0), 0);
    if (score > bestScore) {
      best = record.content;
      bestScore = score;
    }
  }
  return best || texts[0]?.content || "";
}

export function extractSnippet(text, query) {
  const normalized = normalizeText(text);
  if (normalized.length <= MAX_SNIPPET_LENGTH) return normalized;

  const normalizedQuery = normalizeForMatch(query);
  const matchAt = normalized.toLocaleLowerCase().indexOf(normalizedQuery);
  const contentLength = MAX_SNIPPET_LENGTH - 2;
  const start = Math.max(0, Math.min(matchAt > -1 ? matchAt - 80 : 0, normalized.length - contentLength));
  const excerpt = normalized.slice(start, start + contentLength);
  return `${start > 0 ? "…" : ""}${excerpt}${start + contentLength < normalized.length ? "…" : ""}`.slice(0, MAX_SNIPPET_LENGTH);
}

export function restoreSearchIndex(dump, locale) {
  if (dump?.type !== "advanced") throw new RemoteError("Only advanced Orama search indexes are supported.");
  const db = create({
    schema: SEARCH_SCHEMA,
    ...(locale === "zh" ? { components: { tokenizer: createTokenizer() } } : { language: "english" }),
  });
  try {
    load(db, dump);
  } catch {
    throw new RemoteError(`Could not restore the ${locale} search index.`);
  }
  return db;
}

function exactPageIds(pages, query) {
  const normalizedQuery = normalizeForMatch(query);
  return [...pages.entries()]
    .map(([pageId, entry]) => {
      if (!entry.page) return { pageId, score: 0 };
      let score = normalizeForMatch(entry.page.content).includes(normalizedQuery) ? 1_000 : 0;
      if (normalizeForMatch(descriptionFor(entry)).includes(normalizedQuery)) score += 300;
      score += entry.records.filter((record) => record.type === "heading" && normalizeForMatch(record.content).includes(normalizedQuery)).length * 200;
      score += entry.records.filter((record) => record.type === "text" && normalizeForMatch(record.content).includes(normalizedQuery)).length * 100;
      return { pageId, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.pageId);
}

function absoluteUrl(url, siteUrl) {
  return new URL(url, `${siteUrl.replace(/\/+$/, "")}/`).toString();
}

export async function searchDump(dump, { query, locale = "zh", limit = 8, siteUrl = "https://involutionhell.com" }) {
  const db = restoreSearchIndex(dump, locale);
  const response = await search(db, {
    term: query,
    properties: ["content"],
    threshold: 0.3,
    tolerance: 1,
    limit: Math.max(limit * 8, 40),
    groupBy: { properties: ["page_id"], maxResult: 8 },
  });

  const pages = pageRecords(recordsFromDump(dump));
  const fuzzyPageIds = (response.groups ?? []).map((group) => String(group.values[0]));
  const pageIds = [...new Set([...exactPageIds(pages, query), ...fuzzyPageIds])].slice(0, limit);

  return pageIds.flatMap((pageId) => {
    const entry = pages.get(pageId);
    const page = entry?.page ?? getByID(db, pageId);
    if (!entry || !page) return [];
    return [{
      title: normalizeText(page.content),
      url: absoluteUrl(page.url, siteUrl),
      description: descriptionFor({ ...entry, page }),
      snippet: extractSnippet(relevantText(entry, query), query),
    }];
  });
}
