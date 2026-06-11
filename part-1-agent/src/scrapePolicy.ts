import type { EvidenceSource, ToolClient } from "./types.js";
import { repairText } from "./textRepair.js";

export async function scrapeSources(client: ToolClient, sources: EvidenceSource[]): Promise<EvidenceSource[]> {
  const enriched: EvidenceSource[] = [];

  for (const source of sources) {
    try {
      const raw = await client.callTool<unknown>({
        name: "scrape_as_markdown",
        args: { url: source.url }
      });
      const content = extractText(raw);

      if (content.length < 400) {
        enriched.push({
          ...source,
          content,
          scrapeStatus: "partial",
          error: "Scrape returned less than 400 characters of usable content."
        });
        continue;
      }

      enriched.push({
        ...source,
        content: content.slice(0, 6000),
        scrapeStatus: "ok"
      });
    } catch (error) {
      enriched.push({
        ...source,
        scrapeStatus: "failed",
        error: sanitizeError(error)
      });
    }
  }

  return enriched;
}

export function usableSourceCount(sources: EvidenceSource[]): number {
  return sources.filter((source) => source.scrapeStatus === "ok" || source.scrapeStatus === "partial").length;
}

export function assertEnoughEvidence(sources: EvidenceSource[], minimum = 3): void {
  const usable = usableSourceCount(sources);
  if (usable < minimum) {
    throw new Error(
      `Only ${usable} usable sources remained after scraping. Try a broader market, another region, or a higher --max-sources value.`
    );
  }
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
    .slice(0, 500);
}
