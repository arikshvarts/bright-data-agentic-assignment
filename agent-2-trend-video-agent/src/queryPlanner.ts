import type { AgentOptions } from "./types.js";

export function planTrendQueries(options: AgentOptions): string[] {
  const { profile } = options;
  const niche = profile.niche.trim();
  const audience = profile.audience.trim();
  const location = profile.location.trim();
  const language = profile.language.trim();
  const goal = profile.goal.trim();

  return [
    `TikTok trends ${niche} ${location} ${language} ${goal} example videos`,
    `site:tiktok.com ${niche} ${location} trend video ${audience}`,
    `Instagram Reels YouTube Shorts TikTok trend ${niche} ${location} ${audience}`,
    `TikTok Creative Center trends ${niche} ${location} hashtags sounds`,
    `Reddit ${location} ${niche} trending cafe student remote worker social video ideas`,
    `2026 social media trends ${niche} TikTok Reels Shorts local business`
  ];
}
