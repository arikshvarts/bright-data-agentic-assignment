import type { EvidenceSource } from "./types.js";
import { repairText } from "./textRepair.js";

type UnknownRecord = Record<string, unknown>;

export function normalizeToolResult(
  raw: unknown,
  sourceType: EvidenceSource["sourceType"]
): EvidenceSource[] {
  const parsed = parseMaybeJson(raw);
  const records = collectRecords(parsed);

  return records
    .map((record) => toSource(record, sourceType))
    .filter((source): source is EvidenceSource => Boolean(source));
}

export function dedupeSources(sources: EvidenceSource[], maxSources: number): EvidenceSource[] {
  const seen = new Set<string>();
  const deduped: EvidenceSource[] = [];

  for (const source of sources) {
    const key = canonicalUrl(source.url);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(source);
    if (deduped.length >= maxSources) break;
  }

  return deduped;
}

function toSource(record: UnknownRecord, sourceType: EvidenceSource["sourceType"]): EvidenceSource | null {
  const url = firstString(record, ["url", "link", "href"]);
  if (!url || !isHttpUrl(url)) return null;

  const title = firstString(record, ["title", "name"]) ?? url;
  const description = firstString(record, ["description", "snippet", "text", "content"]) ?? "";
  const score = firstNumber(record, ["score", "confidence"]);

  return {
    url,
    title: cleanInline(title),
    sourceType,
    signal: cleanInline(description).slice(0, 320),
    confidence: clampConfidence(score ?? (sourceType === "discover" ? 0.72 : 0.62)),
    scrapeStatus: "not_attempted"
  };
}

function collectRecords(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectRecords);
  }

  if (!isRecord(value)) return [];

  const directUrl = firstString(value, ["url", "link", "href"]);
  if (directUrl) return [value];

  const candidateKeys = ["organic", "results", "items", "data", "result"];
  return candidateKeys.flatMap((key) => collectRecords(value[key]));
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

function cleanInline(text: string): string {
  return repairText(text);
}

function clampConfidence(value: number): number {
  if (value > 1) return Math.max(0, Math.min(1, value / 100));
  return Math.max(0, Math.min(1, value));
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
