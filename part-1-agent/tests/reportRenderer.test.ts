import { describe, expect, it } from "vitest";
import { defaultProfile } from "../src/profile.js";
import {
  renderHtmlDashboard,
  renderMarkdownReport,
} from "../src/reportRenderer.js";
import type { TrendVideoReport } from "../src/types.js";

describe("renderMarkdownReport", () => {
  it("renders trend, concept, evidence, and future pipeline sections", () => {
    const report: TrendVideoReport = {
      analysisVersion: "2.0",
      profile: defaultProfile(),
      region: "il",
      generatedAt: "2026-06-12T00:00:00.000Z",
      toolsUsed: ["search_engine", "discover", "scrape_as_markdown"],
      toolTelemetry: [
        {
          name: "search_engine",
          status: "ok",
          durationMs: 120,
          resultCount: 4,
        },
        { name: "discover", status: "ok", durationMs: 240, resultCount: 3 },
        {
          name: "scrape_as_markdown",
          status: "failed",
          durationMs: 90,
          resultCount: 0,
          error: "blocked page",
        },
      ],
      summary: "Use a **cozy POV** trend.",
      rankedTrends: [
        {
          name: "Cozy work/study POV",
          platform: "tiktok",
          format: "POV micro-vlog",
          topic: "weekday reset",
          score: 20,
          evidenceStrength: "medium",
          nicheFit: "high",
          locationFit: "high",
          productionFit: "high",
          brandSafety: "high",
          fitRationale: "Fits the cafe.",
          risks: [],
          exampleUrls: ["https://www.tiktok.com/@a/video/1"],
          confidence: 0.75,
        },
      ],
      recommendedConcept: {
        title: "Cozy work/study POV for Nook & Pour",
        trendName: "Cozy work/study POV",
        hook: "POV: you found the weekday reset.",
        format: "POV micro-vlog",
        caption: "Save this for your next coffee break.",
        executionStyle: "Phone-shot vertical.",
        productionMode: "human_shot",
        scenePlan: ["Open", "Problem", "Cafe solves", "CTA"],
        shotList: ["Coffee", "Pastry", "Table"],
        confidence: 0.75,
      },
      evidenceLog: [
        {
          url: "https://www.tiktok.com/@a/video/1",
          platform: "tiktok",
          title: "Example",
          sourceType: "search",
          snippet: "POV cafe",
          confidence: 0.7,
          scrapeStatus: "metadata_only",
        },
      ],
      failureNotes: ["One social source was metadata-only."],
      tradeoff: "Free-tier tools.",
      nextSteps: ["Film", "Post", "Measure"],
      futureVideoPipelineDraft: {
        videoSubject: "Cozy work/study POV",
        language: "en",
        aspectRatio: "9:16",
        voiceoverScript: "Open. Problem. Cafe solves. CTA.",
        scenePlan: ["Open", "Problem", "Cafe solves", "CTA"],
        materialKeywords: ["coffee"],
        caption: "Save this.",
        bgmMood: "lo-fi",
        productionMode: "human_shot",
      },
    };

    const markdown = renderMarkdownReport(report);
    expect(markdown).toContain("Future Video Pipeline Draft");
    expect(markdown).toContain("search_engine, discover, scrape_as_markdown");
    expect(markdown).toContain("Cozy work/study POV");

    const dashboard = renderHtmlDashboard(report);
    expect(dashboard).toContain("<!doctype html>");
    expect(dashboard).toContain("Evidence Ledger");
    expect(dashboard).toContain("MCP Execution Trace");
    expect(dashboard).toContain("Storyboard");
    expect(dashboard).toContain("Use a cozy POV trend.");
    expect(dashboard).not.toContain("Use a **cozy POV** trend.");
  });
});
