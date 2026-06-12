import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentOptions, ToolClient, TrendEvidence, TrendVideoReport } from "./types.js";
import { planTrendQueries } from "./queryPlanner.js";
import { dedupeEvidence, normalizeToolResult } from "./sourceNormalizer.js";
import { scrapeEvidence, assertEnoughEvidence } from "./scrapePolicy.js";
import { analyzeTrends } from "./trendAnalyzer.js";
import { synthesizeTrendVideoReport } from "./llm.js";
import { renderMarkdownReport } from "./reportRenderer.js";

export async function runTrendVideoAgent(options: AgentOptions, client: ToolClient): Promise<TrendVideoReport> {
  const queries = planTrendQueries(options);
  const searchResults = await safeToolCalls(client, [
    { name: "search_engine", args: { query: queries[0] } },
    { name: "search_engine", args: { query: queries[2] } },
    { name: "search_engine", args: { query: queries[4] } }
  ]);
  const discoverResults = await safeToolCalls(client, [
    { name: "discover", args: { query: queries[1] } },
    { name: "discover", args: { query: queries[3] } },
    { name: "discover", args: { query: queries[5] } }
  ]);

  const searchEvidence = searchResults.flatMap((result) => normalizeToolResult(result, "search"));
  const discoverEvidence = discoverResults.flatMap((result) => normalizeToolResult(result, "discover"));
  const evidence = dedupeEvidence(interleave(discoverEvidence, searchEvidence).filter((source) => isRelevantEvidence(source, options)), options.maxSources);
  const enrichedEvidence = await scrapeEvidence(client, evidence);
  assertEnoughEvidence(enrichedEvidence);

  const analysis = analyzeTrends(options, enrichedEvidence);
  return synthesizeTrendVideoReport(options, enrichedEvidence, analysis.candidates, analysis.failureNotes);
}

export async function persistReport(report: TrendVideoReport, outputDir = "runs"): Promise<{ markdownPath: string; jsonPath: string }> {
  await mkdir(outputDir, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const baseName = `report-${slug(report.profile.businessName)}-${stamp}`;
  const markdownPath = path.join(outputDir, `${baseName}.md`);
  const jsonPath = path.join(outputDir, `${baseName}.json`);

  await writeFile(markdownPath, renderMarkdownReport(report), "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");

  return { markdownPath, jsonPath };
}

async function safeToolCalls(client: ToolClient, calls: Array<{ name: string; args: Record<string, unknown> }>): Promise<unknown[]> {
  const results: unknown[] = [];
  for (const call of calls) {
    try {
      results.push(await client.callTool(call));
    } catch (error) {
      console.warn(`Bright Data MCP tool ${call.name} failed: ${safeMessage(error)}`);
    }
  }
  return results;
}

function interleave<T>(first: T[], second: T[]): T[] {
  const mixed: T[] = [];
  const max = Math.max(first.length, second.length);
  for (let index = 0; index < max; index += 1) {
    if (first[index]) mixed.push(first[index]);
    if (second[index]) mixed.push(second[index]);
  }
  return mixed;
}

function isRelevantEvidence(source: TrendEvidence, options: AgentOptions): boolean {
  const text = `${source.url} ${source.title} ${source.snippet}`.toLowerCase();
  const locationRoot = options.profile.location.toLowerCase().split(",")[0].trim();
  const businessTerms = options.profile.niche
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 3);
  const isLocalMarket = options.profile.location.includes(",") && !/united states|united kingdom|europe|global/i.test(options.profile.location);

  if (/job|hiring|salary|login|sign in|privacy policy|terms of service/.test(text)) return false;
  if (/real estate|multiple listing service|movie cast|netflix/.test(text)) return false;
  if (/dictionary|merriam-webster|specialtymarketing|yellowpages|tripadvisor|booking\.com|maps\.google/.test(text)) return false;
  if (/bleacherreport|chelseafc|thehistorysource/.test(text)) return false;
  if (/baddie|concert recap|top artists/.test(text)) return false;
  if (/instagram\.com|facebook\.com/.test(text)) return false;
  if (/wikipedia\.org|apps\.apple\.com|play\.google\.com|tiktok\.com\/en\/?$/.test(text)) return false;
  if (/tiktok - make your day|videos, shop & live|global discovery platform/.test(text)) return false;
  if (source.platform === "tiktok" && !/(\/@[^/]+\/video\/|\/discover\/)/.test(text)) return false;
  if (isLocalMarket && source.platform === "tiktok") {
    const stableDiscoveryText = `${source.url} ${source.title}`.toLowerCase();
    if (!stableDiscoveryText.includes(locationRoot)) return false;
  }
  if (isLocalMarket && ["tiktok", "youtube", "reddit"].includes(source.platform) && !text.includes(locationRoot)) return false;
  if (source.platform === "unknown") return false;
  if (source.platform === "article" && !/(trend|tiktok|short-form|creator|social|video)/.test(text)) return false;
  if (!businessTerms.some((term) => text.includes(term)) && !text.includes(locationRoot) && !/(trend|tiktok|creator|short-form|video)/.test(text)) return false;
  return true;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function safeMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .slice(0, 500);
}
