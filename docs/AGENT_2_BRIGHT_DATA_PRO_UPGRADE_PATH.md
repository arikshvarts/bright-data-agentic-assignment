# Agent 2 Bright Data Pro Upgrade Path

Updated: June 18, 2026

Agent 2 now has both a Rapid-compatible path and implemented structured TikTok enrichment through Bright Data MCP.

## Why This Matters

The live MVP already proves the agent flow:

```text
profile -> Bright Data search/discover -> evidence normalization -> scrape/metadata status -> trend scoring -> video concept
```

Public TikTok/YouTube pages still return limited scrapeable text, but direct TikTok URLs are now enriched with Bright Data's structured post/comment tools.

Relevant Bright Data references:

- Bright Data MCP / skills repository: https://github.com/brightdata/skills
- Bright Data MCP tool surface: https://docs.brightdata.com/ai/mcp-server/tools
- Bright Data MCP tools reference: https://github.com/brightdata/brightdata-mcp/blob/main/assets/Tools.md

## Structured Sources Already Added

- `web_data_tiktok_posts`
- `web_data_tiktok_comments`

These provide captions, creator data, publication time, views, likes, shares, comments, hashtags, video URLs, and audience comment text.

## Pro-Mode Sources to Add Next

- TikTok profiles for creator authority and location.
- YouTube videos and comments for cleaner video evidence.
- Reddit posts/comments for pain language, objections, jokes, and repeated questions.
- X/Twitter search for fast-moving meme phrasing when relevant.

Do not replace the current Rapid/free flow. Use Pro Mode to enrich evidence after `search_engine` and `discover` find candidate URLs.

## Additional Source Adapters Inspired by Research

These are product references or future adapters, not required MVP dependencies:

- **TikTok Creative Center / TikTok One:** hashtags, songs, creators, top ads, trend analytics, regional popularity, and industry filters.
- **Google Trends / Trending Now:** local topic momentum, related searches, and emerging-versus-declining validation. The official Google Trends API is alpha/limited, so use public pages or Bright Data extraction for now.
- **Reddit Pro Trends pattern:** keyword monitoring, communities, related terms, conversation volume, and repeated questions.
- **Pinterest Trends:** stronger for fashion, food, beauty, travel, weddings, interiors, and seasonal visual aesthetics.
- **Meta Ad Library:** useful for creative-format intelligence and competitor ad hooks, not organic virality.

## Ranking Improvements

The current agent now includes:

- `trendStage`: `emerging`, `rising`, `evergreen`, or `unclear`
- `validationLevel`: `direct_video`, `platform_discovery`, `supporting_signal`, or `weak`
- `sourceDiversity`: independent creator/community/domain count
- `platformDiversity`: represented platform count
- versioned velocity and saturation with explicit basis

Current structured TikTok metadata already supports:

- views, likes, comments, shares
- upload date / trend age
- hashtags
- top comment text
- country/language match

Still to add:

- sound growth
- creator authority
- stronger comment theme/sentiment clustering
- duplicate-video/perceptual clustering

## What Not To Add Yet

- Do not make unofficial TikTok wrappers the core dependency. They are useful for experiments but can be brittle.
- Do not integrate MoneyPrinterTurbo until the creative brief schema is stable.
- Do not over-index on Google Trends for immediate short-form formats; use it as a validation layer for broader local interest.
- Do not let the LLM choose sources before deterministic filtering.
