import { describe, expect, it } from "vitest";
import { defaultProfile } from "../src/profile.js";
import { runTrendVideoAgent } from "../src/agent.js";
import type { ToolCall, ToolClient } from "../src/types.js";

describe("runTrendVideoAgent", () => {
  it("produces a report without live API calls", async () => {
    const client: ToolClient = {
      async callTool<T = unknown>(call: ToolCall): Promise<T> {
        if (call.name === "search_engine") {
          return {
            organic: [
              {
                url: "https://www.tiktok.com/@coffee/video/1",
                title: "POV cozy study cafe trend",
                snippet:
                  "Tel Aviv coffee shop work/study POV video with 250K views",
              },
              {
                url: "https://www.tiktok.com/discover/coffee-asmr",
                title: "Tel Aviv Coffee ASMR TikTok discovery",
                snippet: "Barista process satisfying coffee trend in Tel Aviv",
              },
            ],
          } as T;
        }
        if (call.name === "discover") {
          return [
            {
              url: "https://www.reddit.com/r/telaviv/comments/cafe",
              title: "Local hidden gem cafe thread",
              description:
                "People recommend quiet Tel Aviv cafes for students and remote workers",
              score: 0.8,
            },
            {
              url: "https://www.vogue.com/article/the-vogue-business-tiktok-trend-tracker",
              title: "TikTok trend tracker",
              description:
                "POV, nostalgia, aura, and cozy lifestyle trend examples",
            },
          ] as T;
        }
        if (call.name === "scrape_as_markdown") {
          return "2026 TikTok trend evidence with POV, cozy cafe, coffee ASMR, local Tel Aviv hidden gem, remote work, students, and example videos. ".repeat(
            8,
          ) as T;
        }
        throw new Error(`Unexpected tool ${call.name}`);
      },
      async close() {},
    };

    const report = await runTrendVideoAgent(
      {
        profile: defaultProfile(),
        region: "il",
        maxSources: 6,
        maxTrends: 3,
      },
      client,
    );

    expect(report.toolsUsed).toEqual([
      "search_engine",
      "discover",
      "scrape_as_markdown",
    ]);
    expect(report.rankedTrends.length).toBeGreaterThanOrEqual(3);
    expect(report.recommendedConcept.scenePlan.length).toBeGreaterThanOrEqual(
      4,
    );
    expect(report.futureVideoPipelineDraft.aspectRatio).toBe("9:16");
    expect(report.failureNotes).toContainEqual(
      expect.stringContaining("deterministic profile-specific synthesis"),
    );
  });
});
