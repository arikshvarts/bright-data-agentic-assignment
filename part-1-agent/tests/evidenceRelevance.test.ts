import { describe, expect, it } from "vitest";
import { defaultProfile } from "../src/profile.js";
import { revalidateEvidence, scoreEvidence } from "../src/evidenceRelevance.js";
import type { TrendEvidence } from "../src/types.js";

describe("evidence relevance", () => {
  it("rejects a misleading SERP result after structured caption enrichment", () => {
    const source = evidence("My final sign off from the Los Angeles news desk", "TikTok coffee trend result");
    const scored = scoreEvidence(options(), { ...source, structuredDataStatus: "ok" });
    expect(scored.relevanceTier).toBe("weak");
  });

  it("keeps niche and location evidence", () => {
    const cafe = scoreEvidence(options(), evidence("Specialty coffee and pastries in Tel Aviv", "Cafe video"));
    expect(cafe.relevanceTier).toBe("direct");
  });

  it("keeps reputable supporting trend surfaces without pretending they are direct fit", () => {
    const article = {
      ...evidence("2026 short-form creator trend report", "TikTok hook formats"),
      platform: "trend_intel" as const,
      url: "https://www.exolyt.com/blog/tiktok-trends"
    };
    const [result] = revalidateEvidence(options(), [article]);
    expect(result.relevanceTier).toBe("supporting");
  });
});

function options() {
  return { profile: defaultProfile(), region: "il", maxSources: 6, maxTrends: 4 };
}

function evidence(title: string, snippet: string): TrendEvidence {
  return {
    url: "https://www.tiktok.com/@creator/video/123",
    platform: "tiktok",
    title,
    sourceType: "search",
    snippet,
    confidence: 0.7,
    scrapeStatus: "metadata_only",
    content: title
  };
}
