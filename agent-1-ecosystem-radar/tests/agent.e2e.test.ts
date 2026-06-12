import { describe, expect, it, vi } from "vitest";
import { runRadarAgent } from "../src/agent.js";
import type { ToolCall, ToolClient } from "../src/types.js";

vi.mock("../src/llm.js", () => ({
  synthesizeReport: vi.fn(async (options, sources) => ({
    company: options.company,
    decision: options.decision,
    region: options.region,
    generatedAt: "2026-06-10T00:00:00.000Z",
    summary: "Mocked decision report summary.",
    toolsUsed: ["search_engine", "discover", "scrape_as_markdown"],
    currentCapabilities: [
      {
        capability: "VS Code / GitHub Copilot MCP connection",
        status: "already_exists",
        implication: "Do not recommend a generic setup.",
        evidenceUrls: ["https://example.com/a"]
      }
    ],
    competitorAnalysis: [
      {
        competitor: "Dawn",
        shipped: "Cross-ecosystem MCP integration.",
        whatWorksWell: "Clear packaging.",
        weaknessOrGap: "Less live-web depth.",
        implicationForBrightData: "Match packaging and differentiate on data depth.",
        evidenceUrls: ["https://example.com/b"]
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
        rationale: "Codex has enough signals to justify a first-party kit.",
        evidenceUrls: ["https://example.com/a"],
        contradictorySignals: [],
        confidence: 0.8
      },
      {
        opportunity: "Claude Code recipe pack",
        ecosystem: "Claude Code",
        evidenceStrength: "medium",
        developerPain: "medium",
        adoptionSignal: "high",
        implementationEffort: "low",
        priority: 2,
        rationale: "Claude Code is important but a recipe pack is the right scope.",
        evidenceUrls: ["https://example.com/b"],
        contradictorySignals: [],
        confidence: 0.75
      },
      {
        opportunity: "Cursor setup guide",
        ecosystem: "Cursor",
        evidenceStrength: "medium",
        developerPain: "medium",
        adoptionSignal: "medium",
        implementationEffort: "low",
        priority: 3,
        rationale: "Cursor docs can be served with a focused setup guide.",
        evidenceUrls: ["https://example.com/c"],
        contradictorySignals: ["Some evidence is community-only."],
        confidence: 0.7
      }
    ],
    recommendedBet: {
      title: "Build a first-party Codex integration kit",
      targetDeveloper: "Developer relations and platform engineers",
      problemSolved: "Reliable live-web access setup for coding agents",
      whyNow: "Codex adoption is growing and integration examples matter.",
      minimumViableScope: ["MCP config", "Codex instructions", "Connectivity check"],
      successMetric: "50 successful demo runs in 30 days",
      whatNotToBuildYet: ["Full SDK", "CRM export"],
      evidenceUrls: ["https://example.com/a"],
      confidence: 0.82
    },
    evidenceSources: sources,
    tradeoff: "Used free-tier tools.",
    nextSteps: ["Review evidence", "Ship a kit", "Measure activation"]
  }))
}));

describe("runRadarAgent", () => {
  it("produces a report using mocked MCP tools", async () => {
    const calls: string[] = [];
    const client: ToolClient = {
      async callTool<T>(call: ToolCall) {
        calls.push(call.name);
        if (call.name === "scrape_as_markdown") return "Long scraped content ".repeat(80) as T;
        return {
          organic: [
            { url: "https://example.com/a", title: "A", description: "A signal" },
            { url: "https://example.com/b", title: "B", description: "B signal" },
            { url: "https://example.com/c", title: "C", description: "C signal" },
            { url: "https://example.com/d", title: "D", description: "D signal" }
          ]
        } as T;
      },
      async close() {}
    };

    const report = await runRadarAgent({
      company: "Bright Data",
      decision: "next coding-agent integration",
      region: "us",
      maxSources: 4
    }, client);

    expect(report.rankedOpportunities).toHaveLength(3);
    expect(report.currentCapabilities[0]?.status).toBe("already_exists");
    expect(report.competitorAnalysis[0]?.competitor).toBe("Dawn");
    expect(report.recommendedBet.title).toContain("Codex");
    expect(new Set(calls)).toEqual(new Set(["search_engine", "discover", "scrape_as_markdown"]));
  });
});
