import { describe, expect, it } from "vitest";
import { defaultProfile } from "../src/profile.js";
import { analyzeTrends } from "../src/trendAnalyzer.js";
import type { TrendEvidence } from "../src/types.js";

describe("analyzeTrends", () => {
  it("clusters evidence into scored trend candidates", () => {
    const evidence: TrendEvidence[] = [
      source("https://www.tiktok.com/@a/video/1", "POV study cafe in Tel Aviv", "POV cozy coffee shop work spot"),
      source("https://www.instagram.com/reel/1", "Coffee ASMR", "Barista latte satisfying process"),
      source("https://www.reddit.com/r/telaviv/comments/1", "Local hidden gem", "Tel Aviv coffee places")
    ];

    const analysis = analyzeTrends({ profile: defaultProfile(), region: "il", maxSources: 6, maxTrends: 3 }, evidence);

    expect(analysis.candidates.length).toBeGreaterThanOrEqual(3);
    expect(analysis.candidates[0].score).toBeGreaterThan(0);
    expect(analysis.candidates.some((candidate) => candidate.name.includes("Cozy"))).toBe(true);
  });
});

function source(url: string, title: string, snippet: string): TrendEvidence {
  return {
    url,
    platform: url.includes("instagram") ? "instagram" : url.includes("reddit") ? "reddit" : "tiktok",
    title,
    sourceType: "search",
    snippet,
    confidence: 0.7,
    scrapeStatus: "ok",
    content: `${title} ${snippet} 2026 trend with example videos and local relevance.`
  };
}
