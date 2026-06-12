import { describe, expect, it } from "vitest";
import { dedupeEvidence, normalizeToolResult } from "../src/sourceNormalizer.js";

describe("sourceNormalizer", () => {
  it("normalizes nested search results and dedupes canonical URLs", () => {
    const sources = normalizeToolResult(
      {
        organic: [
          {
            url: "https://www.tiktok.com/@barista/video/1?utm_source=x",
            title: "Coffee ASMR trend",
            snippet: "Barista process video with 1.2M views"
          },
          {
            link: "https://www.tiktok.com/@barista/video/1?utm_source=x",
            title: "Duplicate",
            description: "Duplicate"
          }
        ]
      },
      "search"
    );

    expect(sources).toHaveLength(2);
    expect(sources[0].platform).toBe("tiktok");
    expect(sources[0].engagementHint).toBe("1.2M views");
    expect(dedupeEvidence(sources, 10)).toHaveLength(1);
  });
});
