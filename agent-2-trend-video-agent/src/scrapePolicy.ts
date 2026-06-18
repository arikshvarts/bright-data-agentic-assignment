import type { ToolClient, TrendEvidence } from "./types.js";
import { isSocialPlatform } from "./platformClassifier.js";
import { repairText } from "./textRepair.js";

export async function scrapeEvidence(client: ToolClient, sources: TrendEvidence[]): Promise<TrendEvidence[]> {
  const enriched: TrendEvidence[] = [];

  for (const source of sources) {
    try {
      const raw = await client.callTool<unknown>({
        name: "scrape_as_markdown",
        args: { url: source.url }
      });
      const content = extractText(raw);

      if (content.length < 120 && isSocialPlatform(source.platform)) {
        enriched.push({
          ...source,
          content,
          scrapeStatus: "metadata_only",
          error: "Social page returned little scrapeable text; retaining URL and search/discover metadata as evidence.",
          qualityNotes: [...(source.qualityNotes ?? []), "metadata-only social source"]
        });
        continue;
      }

      if (content.length < 400) {
        enriched.push({
          ...source,
          content,
          scrapeStatus: "partial",
          error: "Scrape returned less than 400 characters of usable content.",
          qualityNotes: [...(source.qualityNotes ?? []), "partial scrape"]
        });
        continue;
      }

      enriched.push({
        ...source,
        content: content.slice(0, 7000),
        scrapeStatus: "ok",
        qualityNotes: [...(source.qualityNotes ?? []), "scrape ok"]
      });
    } catch (error) {
      enriched.push({
        ...source,
        scrapeStatus: isSocialPlatform(source.platform) ? "metadata_only" : "failed",
        error: sanitizeError(error),
        qualityNotes: [
          ...(source.qualityNotes ?? []),
          isSocialPlatform(source.platform) ? "scrape failed but direct social URL retained" : "scrape failed"
        ]
      });
    }
  }

  return enriched;
}

export function usableEvidenceCount(sources: TrendEvidence[]): number {
  return sources.filter((source) => ["ok", "partial", "metadata_only"].includes(source.scrapeStatus)).length;
}

export function assertEnoughEvidence(sources: TrendEvidence[], minimum = 3): void {
  const usable = usableEvidenceCount(sources);
  const weighted = sources.reduce((total, source) => total + evidenceWeight(source), 0);
  if (usable < minimum || weighted < 1.5) {
    throw new Error(
      `Only ${usable} usable sources remained with a weighted evidence score of ${weighted.toFixed(2)}. ` +
        "Metadata-only pages count less than successful scrapes. Try a broader niche, another location, or a higher --max-sources value."
    );
  }
}

export function evidenceWeight(source: TrendEvidence): number {
  if (source.structuredDataStatus === "ok") return 1.2;
  if (source.scrapeStatus === "ok") return 1;
  if (source.scrapeStatus === "partial") return 0.7;
  if (source.scrapeStatus === "metadata_only") return 0.35;
  return 0;
}

function extractText(raw: unknown): string {
  if (typeof raw === "string") return clean(raw);
  if (Array.isArray(raw)) return clean(raw.map(extractText).join("\n"));
  if (typeof raw === "object" && raw !== null) {
    const record = raw as Record<string, unknown>;
    if (typeof record.content === "string") return clean(record.content);
    if (typeof record.text === "string") return clean(record.text);
    return clean(JSON.stringify(raw));
  }
  return "";
}

function clean(value: string): string {
  return repairText(value);
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/API_TOKEN=[^&\s]+/g, "API_TOKEN=[redacted]")
    .replace(/(ANTHROPIC_API_KEY|OPENAI_API_KEY|BRIGHT_DATA_API_TOKEN)=\S+/g, "$1=[redacted]")
    .slice(0, 500);
}
