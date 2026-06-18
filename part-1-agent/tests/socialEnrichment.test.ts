import { describe, expect, it } from "vitest";
import { enrichTikTokEvidence } from "../src/socialEnrichment.js";
import type { ToolCall, ToolClient, TrendEvidence } from "../src/types.js";

describe("enrichTikTokEvidence", () => {
  it("merges structured TikTok post metrics and comment evidence", async () => {
    process.env.SOCIAL_ENRICH_MAX_POSTS = "1";
    process.env.SOCIAL_ENRICH_MAX_COMMENTS = "1";
    const calls: string[] = [];
    const client: ToolClient = {
      async callTool<T = unknown>(call: ToolCall): Promise<T> {
        calls.push(call.name);
        if (call.name === "web_data_tiktok_posts") {
          return [
            {
              caption: "Three finance mistakes freelancers make #bookkeeping #freelance",
              author_name: "ledgercoach",
              create_time: 1_750_000_000,
              views: 120000,
              likes: 9000,
              shares: 800,
              comment_count: 250,
              video_url: "https://cdn.example/video.mp4"
            }
          ] as T;
        }
        if (call.name === "web_data_tiktok_comments") {
          return [
            { comment_text: "Can you show the invoice workflow?", likes: 42 },
            { comment_text: "This saved me hours.", likes: 80 }
          ] as T;
        }
        throw new Error(`Unexpected tool ${call.name}`);
      },
      async close() {}
    };

    const source: TrendEvidence = {
      url: "https://www.tiktok.com/@ledgercoach/video/123456",
      platform: "tiktok",
      title: "Finance tips",
      sourceType: "discover",
      snippet: "Freelancer bookkeeping",
      confidence: 0.8,
      scrapeStatus: "metadata_only"
    };

    const [result] = await enrichTikTokEvidence(client, [source]);
    expect(calls).toEqual(["web_data_tiktok_posts", "web_data_tiktok_comments"]);
    expect(result.structuredDataStatus).toBe("ok");
    expect(result.views).toBe(120000);
    expect(result.hashtags).toContain("bookkeeping");
    expect(result.commentInsights?.[0]).toContain("saved me hours");
    delete process.env.SOCIAL_ENRICH_MAX_POSTS;
    delete process.env.SOCIAL_ENRICH_MAX_COMMENTS;
  });

  it("keeps Rapid evidence when social tools are unavailable", async () => {
    process.env.SOCIAL_ENRICH_MAX_POSTS = "1";
    process.env.SOCIAL_ENRICH_MAX_COMMENTS = "0";
    const client: ToolClient = {
      async callTool() {
        throw new Error("tool unavailable");
      },
      async close() {}
    };
    const source: TrendEvidence = {
      url: "https://www.tiktok.com/@creator/video/123456",
      platform: "tiktok",
      title: "Trend",
      sourceType: "search",
      snippet: "Evidence",
      confidence: 0.7,
      scrapeStatus: "metadata_only"
    };

    const [result] = await enrichTikTokEvidence(client, [source]);
    expect(result.url).toBe(source.url);
    expect(result.structuredDataStatus).toBe("failed");
    delete process.env.SOCIAL_ENRICH_MAX_POSTS;
    delete process.env.SOCIAL_ENRICH_MAX_COMMENTS;
  });
});
