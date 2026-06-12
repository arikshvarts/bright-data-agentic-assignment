import type { AgentOptions } from "./types.js";

export function planTrendQueries(options: AgentOptions): string[] {
  const { profile } = options;
  const niche = profile.niche.trim();
  const audience = profile.audience.trim();
  const location = profile.location.trim();
  const language = profile.language.trim();
  const goal = profile.goal.trim();

  return [
    `site:tiktok.com/@ ${niche} ${location} trend video ${audience}`,
    `site:tiktok.com/discover ${niche} ${location} trending ${audience}`,
    `TikTok Creative Center trends hashtags sounds ${niche} ${location}`,
    `TikTok Creative Center trends ${niche} ${location} hashtags sounds`,
    `TikTok trend tracker ${niche} ${location} creators formats examples`,
    `2026 TikTok trends ${niche} short form video ideas local business ${goal}`,
    `Reddit ${location} ${niche} TikTok trend video ideas audience ${audience}`
  ];
}
