import type { TrendEvidence } from "./types.js";
import { classifyPlatform } from "./platformClassifier.js";
import { repairText } from "./textRepair.js";

type UnknownRecord = Record<string, unknown>;

export function normalizeToolResult(raw: unknown, sourceType: TrendEvidence["sourceType"]): TrendEvidence[] {
  const parsed = parseMaybeJson(raw);
  const records = collectRecords(parsed);

  return records
    .map((record) => toEvidence(record, sourceType))
    .filter((source): source is TrendEvidence => Boolean(source));
}

export function dedupeEvidence(sources: TrendEvidence[], maxSources: number): TrendEvidence[] {
  const seen = new Set<string>();
  const deduped: TrendEvidence[] = [];

  for (const source of sources) {
    const key = canonicalUrl(source.url);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(source);
    if (deduped.length >= maxSources) break;
  }

  return deduped;
}

function toEvidence(record: UnknownRecord, sourceType: TrendEvidence["sourceType"]): TrendEvidence | null {
  const url = firstString(record, ["url", "link", "href"]);
  if (!url || !isHttpUrl(url)) return null;

  const title = firstString(record, ["title", "name"]) ?? url;
  const snippet = firstString(record, ["description", "snippet", "text", "content"]) ?? "";
  const score = firstNumber(record, ["score", "confidence"]);
  const cleanTitle = repairText(title);
  const cleanSnippet = repairText(snippet).slice(0, 360);

  return {
    url,
    platform: classifyPlatform(url, cleanTitle),
    title: cleanTitle,
    sourceType,
    snippet: cleanSnippet,
    confidence: clampConfidence(score ?? (sourceType === "discover" ? 0.72 : 0.62)),
    scrapeStatus: "not_attempted",
    recencyHint: extractRecency(cleanTitle, cleanSnippet),
    regionHint: extractRegion(cleanTitle, cleanSnippet),
    engagementHint: extractEngagement(cleanTitle, cleanSnippet),
    qualityNotes: []
  };
}

function collectRecords(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.flatMap(collectRecords);
  if (!isRecord(value)) return [];

  const directUrl = firstString(value, ["url", "link", "href"]);
  if (directUrl) return [value];

  return ["organic", "results", "items", "data", "result"].flatMap((key) => collectRecords(value[key]));
}

function parseMaybeJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function firstString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function firstNumber(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function clampConfidence(value: number): number {
  if (value > 1) return Math.max(0, Math.min(1, value / 100));
  return Math.max(0, Math.min(1, value));
}

function extractRecency(...parts: string[]): string | undefined {
  const text = parts.join(" ");
  return text.match(/\b(2026|2025|today|this week|recent|latest|new|viral)\b/i)?.[0];
}

function extractRegion(...parts: string[]): string | undefined {
  const text = parts.join(" ");
  return text.match(/\b(Tel Aviv|Israel|US|United States|UK|London|New York|Europe|local)\b/i)?.[0];
}

function extractEngagement(...parts: string[]): string | undefined {
  const text = parts.join(" ");
  return text.match(/\b\d+(?:\.\d+)?\s?(?:k|m|b|million|billion)?\s?(?:views|likes|posts|videos|creations)\b/i)?.[0];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
