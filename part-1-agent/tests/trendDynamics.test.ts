import { describe, expect, it } from "vitest";
import { applyTrendDynamics } from "../src/trendDynamics.js";
import { defaultProfile } from "../src/profile.js";
import type { TrendCandidate, TrendEvidence } from "../src/types.js";

describe("trend dynamics", () => {
  it("does not claim velocity from wording alone", () => {
    const result = applyTrendDynamics(options(), [evidence()], [candidate()], []);
    expect(result.candidates[0].velocityLabel).toBe("unknown");
    expect(result.candidates[0].velocityBasis).toContain("no velocity claim");
  });

  it("uses structured publication and engagement for a snapshot estimate", () => {
    const source = {
      ...evidence(),
      publishedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      views: 500000,
      structuredDataStatus: "ok" as const
    };
    const result = applyTrendDynamics(options(), [source], [candidate()], []);
    expect(result.candidates[0].velocityScore).toBeGreaterThan(0);
    expect(result.candidates[0].velocityBasis).toContain("views/day");
  });

  it("uses prior reports for run-over-run velocity", () => {
    const result = applyTrendDynamics(options(), [evidence()], [candidate()], [
      {
        analysisVersion: "2.0",
        generatedAt: "2026-06-01T00:00:00.000Z",
        profile: defaultProfile(),
        rankedTrends: [{ ...candidate(), score: 10, independentSourceCount: 1 }]
      }
    ]);
    expect(result.candidates[0].velocityBasis).toContain("Run-over-run");
    expect(result.candidates[0].velocityScore).toBeGreaterThan(50);
  });
});

function options() {
  return { profile: defaultProfile(), region: "il", maxSources: 6, maxTrends: 4 };
}

function evidence(): TrendEvidence {
  return {
    url: "https://www.tiktok.com/@creator/video/1",
    platform: "tiktok",
    title: "2026 latest rising viral trend",
    sourceType: "search",
    snippet: "The word rising should not be enough.",
    confidence: 0.7,
    scrapeStatus: "metadata_only",
    independentSourceKey: "tiktok:creator:creator"
  };
}

function candidate(): TrendCandidate {
  return {
    name: "POV routine or day-in-the-life",
    platform: "tiktok",
    format: "POV",
    topic: "routine",
    score: 20,
    evidenceStrength: "medium",
    nicheFit: "high",
    locationFit: "medium",
    productionFit: "high",
    brandSafety: "high",
    sourceDiversity: 1,
    platformDiversity: 1,
    independentSourceCount: 1,
    fitRationale: "Fits.",
    risks: [],
    exampleUrls: ["https://www.tiktok.com/@creator/video/1"],
    confidence: 0.7
  };
}
