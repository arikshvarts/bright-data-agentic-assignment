import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentOptions, RadarReport, ToolClient } from "./types.js";
import { planQueries } from "./queryPlanner.js";
import { dedupeSources, normalizeToolResult } from "./sourceNormalizer.js";
import { scrapeSources, assertEnoughEvidence } from "./scrapePolicy.js";
import { synthesizeReport } from "./llm.js";
import { renderMarkdownReport } from "./reportRenderer.js";
import { analyzeEvidence } from "./evidenceScorer.js";

export async function runRadarAgent(options: AgentOptions, client: ToolClient): Promise<RadarReport> {
  const queries = planQueries(options);
  const searchResults = await safeToolCalls(client, [
    { name: "search_engine", args: { query: queries[0] } }
  ]);

  const discoverResults = await safeToolCalls(client, [
    { name: "discover", args: { query: queries[1] } }
  ]);

  const searchSources = searchResults.flatMap((result) => normalizeToolResult(result, "search"));
  const discoverSources = discoverResults.flatMap((result) => normalizeToolResult(result, "discover"));
  const sources = dedupeSources(interleave(discoverSources, searchSources).filter(isRelevantSource), options.maxSources);

  const enrichedSources = await scrapeSources(client, sources);
  assertEnoughEvidence(enrichedSources);

  return synthesizeReport(options, enrichedSources, analyzeEvidence(enrichedSources));
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

export async function persistReport(report: RadarReport, outputDir = "runs"): Promise<{ markdownPath: string; jsonPath: string }> {
  await mkdir(outputDir, { recursive: true });
  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const baseName = `report-${slug(report.company)}-${stamp}`;
  const markdownPath = path.join(outputDir, `${baseName}.md`);
  const jsonPath = path.join(outputDir, `${baseName}.json`);

  await writeFile(markdownPath, renderMarkdownReport(report), "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");

  return { markdownPath, jsonPath };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
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

function isRelevantSource(source: { url: string; title: string; signal: string }): boolean {
  if (/brightmls\.com|wikipedia\.org\/wiki\/Bright_/i.test(source.url)) return false;
  if (/real estate|housing market|multiple listing service/i.test(`${source.title} ${source.signal}`)) return false;
  if (/\bfilm\b|\bmovie\b|\bnetflix\b|\bcast\b/i.test(`${source.title} ${source.signal}`) && /bright/i.test(`${source.title} ${source.signal}`)) return false;
  return true;
}

function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 500);
}
