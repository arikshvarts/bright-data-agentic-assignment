import { describe, expect, it } from "vitest";
import { renderMarkdownReport } from "../src/reportRenderer.js";
import type { RadarReport } from "../src/types.js";

describe("reportRenderer", () => {
  it("renders a readable Markdown report with evidence links", () => {
    const markdown = renderMarkdownReport(report);

    expect(markdown).toContain("# Agent Ecosystem Opportunity Radar: Bright Data");
    expect(markdown).toContain("Current Bright Data Coverage");
    expect(markdown).toContain("Competitor / Comparable Signals");
    expect(markdown).toContain("Recommended 90-Day Bet");
    expect(markdown).toContain("[source](https://example.com/a)");
    expect(markdown).toContain("search_engine, discover, scrape_as_markdown");
  });
});

const report: RadarReport = {
  company: "Bright Data",
  decision: "next coding-agent integration",
  region: "us",
  generatedAt: "2026-06-10T00:00:00.000Z",
  summary: "Bright Data should prioritize a coding-agent integration decision.",
  toolsUsed: ["search_engine", "discover", "scrape_as_markdown"],
  currentCapabilities: [
    {
      capability: "VS Code / GitHub Copilot MCP connection",
      status: "already_exists",
      implication: "Build on top of this instead of recommending a generic VS Code setup.",
      evidenceUrls: ["https://example.com/a"]
    }
  ],
  competitorAnalysis: [
    {
      competitor: "Dawn",
      shipped: "Cross-ecosystem MCP workflow.",
      whatWorksWell: "Clear Codex/Cursor/Copilot packaging.",
      weaknessOrGap: "Does not prove Bright Data-level web data depth.",
      implicationForBrightData: "Ship comparable packaging with stronger live-web tooling.",
      evidenceUrls: ["https://example.com/a"]
    }
  ],
  rankedOpportunities: [
    {
      opportunity: "Codex integration kit",
      ecosystem: "Codex",
      evidenceStrength: "high",
      developerPain: "high",
      adoptionSignal: "high",
      implementationEffort: "medium",
      priority: 1,
      rationale: "Codex has enough source evidence to justify a first-party kit.",
      evidenceUrls: ["https://example.com/a"],
      contradictorySignals: [],
      confidence: 0.81
    }
  ],
  recommendedBet: {
    title: "Build a first-party Codex integration kit",
    targetDeveloper: "Developer relations and platform engineers",
    problemSolved: "Reliable live-web access setup inside coding agents",
    whyNow: "Coding-agent ecosystems are competing on integration quality.",
    minimumViableScope: ["MCP config", "Reusable instructions", "Connectivity validation"],
    successMetric: "50 successful demo runs in 30 days",
    whatNotToBuildYet: ["Full SDK", "Complex UI"],
    evidenceUrls: ["https://example.com/a"],
    confidence: 0.84
  },
  evidenceSources: [
    {
      url: "https://example.com/a",
      title: "Example",
      sourceType: "search",
      signal: "A signal",
      confidence: 0.7,
      scrapeStatus: "ok"
    }
  ],
  tradeoff: "Used free-tier tools.",
  nextSteps: ["Validate with one ICP", "Add CRM export", "Schedule weekly runs"]
};
