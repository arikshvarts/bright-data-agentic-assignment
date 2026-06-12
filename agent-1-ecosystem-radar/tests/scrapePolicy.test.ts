import { describe, expect, it } from "vitest";
import { assertEnoughEvidence, scrapeSources } from "../src/scrapePolicy.js";
import type { EvidenceSource, ToolCall, ToolClient } from "../src/types.js";

const sources: EvidenceSource[] = [
  source("https://example.com/a"),
  source("https://example.com/b"),
  source("https://example.com/c")
];

describe("scrapePolicy", () => {
  it("marks failed scrapes and keeps processing remaining sources", async () => {
    const client: ToolClient = {
      async callTool<T>(call: ToolCall) {
        if (call.args.url === "https://example.com/b") throw new Error("403 blocked");
        return "Useful content ".repeat(80) as T;
      },
      async close() {}
    };

    const enriched = await scrapeSources(client, sources);

    expect(enriched.map((item) => item.scrapeStatus)).toEqual(["ok", "failed", "ok"]);
    expect(() => assertEnoughEvidence(enriched, 2)).not.toThrow();
  });

  it("fails clearly when too few sources are usable", () => {
    expect(() =>
      assertEnoughEvidence(
        sources.map((item) => ({ ...item, scrapeStatus: "failed" })),
        3
      )
    ).toThrow(/Only 0 usable sources/);
  });
});

function source(url: string): EvidenceSource {
  return {
    url,
    title: url,
    sourceType: "search",
    signal: "signal",
    confidence: 0.7,
    scrapeStatus: "not_attempted"
  };
}
