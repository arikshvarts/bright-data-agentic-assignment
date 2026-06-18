import { describe, expect, it } from "vitest";
import {
  dedupeEvidence,
  normalizeToolResult,
} from "../src/sourceNormalizer.js";

describe("sourceNormalizer", () => {
  it("normalizes nested search results and dedupes canonical URLs", () => {
    const sources = normalizeToolResult(
      {
        organic: [
          {
            url: "https://www.tiktok.com/@barista/video/1?utm_source=x",
            title: "Coffee ASMR trend",
            snippet: "Barista process video with 1.2M views",
          },
          {
            link: "https://www.tiktok.com/@barista/video/1?utm_source=x",
            title: "Duplicate",
            description: "Duplicate",
          },
          {
            link: "https://example.com/coffee-trends?srsltid=tracking-a",
            title: "Coffee trends",
            description: "Canonical article",
          },
          {
            link: "https://example.com/coffee-trends?srsltid=tracking-b",
            title: "Same coffee trends",
            description: "Same article with another tracking token",
          },
        ],
      },
      "search",
    );

    expect(sources).toHaveLength(4);
    expect(sources[0].platform).toBe("tiktok");
    expect(sources[0].engagementHint).toBe("1.2M views");
    expect(sources[0].independentSourceKey).toBe("tiktok:creator:barista");
    expect(dedupeEvidence(sources, 10)).toHaveLength(2);
  });

  it("drops opaque Google redirect wrappers from the evidence ledger", () => {
    const sources = normalizeToolResult(
      {
        organic: [
          {
            url: "https://www.google.com/goto?url=opaque-token",
            title: "Wrapped result",
            snippet: "The real destination is not inspectable.",
          },
          {
            url: "https://www.reddit.com/r/freelance/comments/example",
            title: "Freelance bookkeeping workflow",
            snippet: "A directly inspectable source.",
          },
        ],
      },
      "search",
    );

    expect(sources).toHaveLength(1);
    expect(sources[0].platform).toBe("reddit");
  });
});
