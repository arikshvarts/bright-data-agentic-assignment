import type { AgentOptions } from "./types.js";

export function planTrendQueries(options: AgentOptions): string[] {
  const { profile } = options;
  const niche = profile.niche.trim();
  const audience = profile.audience.trim();
  const location = profile.location.trim();
  const language = profile.language.trim();
  const goal = profile.goal.trim();
  const region = options.region.toUpperCase();

  return [
    `site:tiktok.com/@ ${niche} ${location} ${language} trend video ${audience}`,
    `site:tiktok.com/discover ${niche} ${location} ${language} trending ${audience}`,
    `TikTok Creative Center trends hashtags sounds ${niche} ${location} ${language}`,
    `TikTok Creative Center trends ${niche} ${location} ${language} hashtags sounds`,
    `TikTok trend tracker ${niche} ${location} ${language} creators formats examples`,
    `2026 TikTok trends ${niche} ${language} short form video ideas ${region} ${goal}`,
    `site:reddit.com ${location} ${niche} ${language} TikTok trend video ideas ${audience}`
  ];
}
