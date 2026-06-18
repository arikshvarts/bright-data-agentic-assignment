import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentOptions, ToolClient, TrendEvidence, TrendVideoReport } from "./types.js";
import { planTrendQueries } from "./queryPlanner.js";
import { dedupeEvidence, normalizeToolResult } from "./sourceNormalizer.js";
import { scrapeEvidence, assertEnoughEvidence } from "./scrapePolicy.js";
import { analyzeTrends } from "./trendAnalyzer.js";
import { synthesizeTrendVideoReport } from "./llm.js";
import { renderHtmlDashboard, renderMarkdownReport } from "./reportRenderer.js";
import { trackToolClient, toolFailureNotes } from "./toolTelemetry.js";
import { enrichTikTokEvidence } from "./socialEnrichment.js";
import { applyTrendDynamics, loadTrendHistory } from "./trendDynamics.js";
import { revalidateEvidence } from "./evidenceRelevance.js";

export async function runTrendVideoAgent(options: AgentOptions, client: ToolClient): Promise<TrendVideoReport> {
  const trackedClient = trackToolClient(client);
  const queries = planTrendQueries(options);
  const geo = options.region.toLowerCase();
  const language = languageCode(options.profile.language);
  const searchResults = await safeToolCalls(trackedClient, [
    { name: "search_engine", args: { query: queries[0], engine: "google", geo_location: geo } },
    { name: "search_engine", args: { query: queries[2], engine: "google", geo_location: geo } },
    { name: "search_engine", args: { query: queries[4], engine: "google", geo_location: geo } },
    { name: "search_engine", args: { query: queries[6], engine: "google", geo_location: geo } }
  ]);
  const discoverResults = await safeToolCalls(trackedClient, [
    { name: "discover", args: discoverArgs(queries[1], options, language) },
    { name: "discover", args: discoverArgs(queries[3], options, language) },
    { name: "discover", args: discoverArgs(queries[5], options, language) }
  ]);

  const searchEvidence = searchResults.flatMap((result) => normalizeToolResult(result, "search"));
  const discoverEvidence = discoverResults.flatMap((result) => normalizeToolResult(result, "discover"));
  const preliminaryEvidence = revalidateEvidence(
    options,
    interleave(discoverEvidence, searchEvidence).filter((source) => isRelevantEvidence(source, options))
  );
  const evidence = dedupeEvidence(preliminaryEvidence, options.maxSources);
  const scrapedEvidence = await scrapeEvidence(trackedClient, evidence);
  const socialEvidence = await enrichTikTokEvidence(trackedClient, scrapedEvidence);
  const enrichedEvidence = revalidateEvidence(options, socialEvidence);
  assertEnoughEvidence(enrichedEvidence);

  const analysis = analyzeTrends(options, enrichedEvidence);
  const history = await loadTrendHistory(options.profile.businessName);
  const dynamics = applyTrendDynamics(options, enrichedEvidence, analysis.candidates, history);
  return synthesizeTrendVideoReport(
    options,
    enrichedEvidence,
    dynamics.candidates,
    [...analysis.failureNotes, ...dynamics.notes, ...toolFailureNotes(trackedClient.telemetry)],
    trackedClient.telemetry
  );
}

export async function persistReport(
  report: TrendVideoReport,
  outputDir = "runs"
): Promise<{ markdownPath: string; jsonPath: string; dashboardPath: string }> {
  await mkdir(outputDir, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const baseName = `report-${slug(report.profile.businessName)}-${stamp}`;
  const markdownPath = path.join(outputDir, `${baseName}.md`);
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  const dashboardPath = path.join(outputDir, `${baseName}.html`);

  await writeFile(markdownPath, renderMarkdownReport(report), "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await writeFile(dashboardPath, renderHtmlDashboard(report), "utf8");

  return { markdownPath, jsonPath, dashboardPath };
}

async function safeToolCalls(client: ToolClient, calls: Array<{ name: string; args: Record<string, unknown> }>): Promise<unknown[]> {
  const results: unknown[] = [];
  for (const call of calls) {
    try {
      results.push(await client.callTool(call));
    } catch (error) {
      console.warn(`Bright Data MCP tool ${call.name} failed: ${safeMessage(error)}`);
      if (call.name === "discover" && call.args.city && /invalid city/i.test(safeMessage(error))) {
        const retryArgs = { ...call.args };
        delete retryArgs.city;
        try {
          console.warn("Retrying Bright Data discover with country/language targeting and no city.");
          results.push(await client.callTool({ name: call.name, args: retryArgs }));
        } catch (retryError) {
          console.warn(`Bright Data MCP tool ${call.name} retry failed: ${safeMessage(retryError)}`);
        }
      }
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
  const businessTerms = `${options.profile.niche} ${options.profile.profile}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 4 && !["business", "creator", "content", "video", "social", "young", "people", "place", "spot", "work"].includes(term));

  if (/job|hiring|salary|login|sign in|privacy policy|terms of service/.test(text)) return false;
  if (/real estate|multiple listing service|movie cast|netflix/.test(text)) return false;
  if (/dictionary|merriam-webster|specialtymarketing|yellowpages|tripadvisor|booking\.com|maps\.google/.test(text)) return false;
  if (/bleacherreport|chelseafc|thehistorysource/.test(text)) return false;
  if (/baddie|concert recap|top artists/.test(text)) return false;
  if (/instagram\.com|facebook\.com/.test(text)) return false;
  if (/wikipedia\.org|apps\.apple\.com|play\.google\.com|tiktok\.com\/en\/?$/.test(text)) return false;
  if (/tiktok - make your day|videos, shop & live|global discovery platform/.test(text)) return false;
  if (source.platform === "tiktok" && !/(\/@[^/]+\/video\/|\/discover\/)/.test(text)) return false;
  if (source.platform === "unknown") return false;
  if (source.platform === "article" && !/(trend|tiktok|short-form|creator|social|video)/.test(text)) return false;
  const supportingSurface = ["creative_center", "trend_intel", "article", "reddit", "youtube"].includes(source.platform);
  if (!businessTerms.some((term) => text.includes(term)) && !text.includes(locationRoot) && !supportingSurface) return false;
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

function discoverArgs(query: string, options: AgentOptions, language: string): Record<string, unknown> {
  return {
    query,
    intent: `Find recent, concrete short-form video trend evidence relevant to ${options.profile.niche}, ${options.profile.audience}, and ${options.profile.goal}.`,
    country: options.region.toUpperCase(),
    language,
    num_results: Math.max(5, options.maxSources),
    remove_duplicates: true
  };
}

function languageCode(language: string): string {
  if (/hebrew|עברית/i.test(language)) return "he";
  if (/spanish|español/i.test(language)) return "es";
  if (/french|français/i.test(language)) return "fr";
  if (/german|deutsch/i.test(language)) return "de";
  if (/arabic|العربية/i.test(language)) return "ar";
  return "en";
}
