import { describe, expect, it } from "vitest";
import { assertEnoughEvidence, evidenceWeight, scrapeEvidence } from "../src/scrapePolicy.js";
import type { ToolClient, TrendEvidence } from "../src/types.js";

const baseSource: TrendEvidence = {
  url: "https://www.tiktok.com/@creator/video/123",
  platform: "tiktok",
  title: "Coffee trend",
  sourceType: "search",
  snippet: "A coffee video trend",
  confidence: 0.7,
  scrapeStatus: "not_attempted"
};

describe("scrapeEvidence", () => {
  it("keeps inaccessible social sources as metadata-only evidence", async () => {
    const client: ToolClient = {
      async callTool() {
        throw new Error("blocked page");
      },
      async close() {}
    };

    const [source] = await scrapeEvidence(client, [baseSource]);
    expect(source.scrapeStatus).toBe("metadata_only");
    expect(source.error).toContain("blocked page");
  });

  it("rejects weak evidence sets", () => {
    expect(() => assertEnoughEvidence([{ ...baseSource, scrapeStatus: "failed" }], 3)).toThrow(/Only 0 usable/);
  });

  it("weights metadata-only evidence below successful scrapes", () => {
    expect(evidenceWeight({ ...baseSource, scrapeStatus: "metadata_only" })).toBeLessThan(
      evidenceWeight({ ...baseSource, scrapeStatus: "ok" })
    );
    expect(() =>
      assertEnoughEvidence(
        [
          { ...baseSource, url: `${baseSource.url}1`, scrapeStatus: "metadata_only" },
          { ...baseSource, url: `${baseSource.url}2`, scrapeStatus: "metadata_only" },
          { ...baseSource, url: `${baseSource.url}3`, scrapeStatus: "metadata_only" }
        ],
        3
      )
    ).toThrow(/weighted evidence score/);
  });
});
