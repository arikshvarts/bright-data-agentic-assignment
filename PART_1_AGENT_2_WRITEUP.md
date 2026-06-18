# Part 1 Agent 2 Writeup: Trend-to-Video Agent

## What I Built

I added a second Mission 1 candidate: **Trend-to-Video Agent**, a Bright Data MCP-powered creative strategy agent.

The user provides a business/profile, niche, audience, location, language, goal, and production capabilities. The agent searches the live web for recent trend signals and returns a ranked set of trend opportunities plus one production-ready short-video concept.

The default demo is a local cafe in Tel Aviv:

```text
Business: Nook & Pour
Niche: specialty coffee, pastries, cozy work/study spot
Audience: students, remote workers, young professionals
Location: Tel Aviv, Israel
Goal: increase weekday visits
Capabilities: phone-shot vertical video, staff can appear on camera, no paid creator budget
```

## Why This Fits the Mission

The assignment asks for a creative, production-quality web agent using Bright Data MCP. This idea is strong because it turns messy public-web/social evidence into a concrete business artifact: a video concept someone can actually shoot.

It is not a generic trend list. The agent asks:

- does this trend fit the business?
- does it fit the local audience?
- is there evidence from real web/social sources?
- can the user actually produce it with their capabilities?
- should it be human-shot, AI-generated, or hybrid?

## Bright Data MCP Usage

The default live agent now uses four distinct Bright Data MCP tools:

- `search_engine`
- `discover`
- `scrape_as_markdown`
- `web_data_tiktok_posts`

The deep social mode also uses:

- `web_data_tiktok_comments`

`search_engine` receives geo targeting. `discover` receives country/language targeting and intent ranking. `scrape_as_markdown` extracts source content or confirms thin public metadata. Structured TikTok tools add captions, creator details, publication time, engagement, hashtags, video URLs, and comments.

## Architecture

1. `profile.ts` loads the creator/business profile from flags, JSON, or simple Markdown.
2. `queryPlanner.ts` creates TikTok-first, location-aware trend queries.
3. `agent.ts` calls Bright Data MCP `search_engine` and `discover`.
4. `sourceNormalizer.ts` normalizes result shapes into `TrendEvidence`.
5. `platformClassifier.ts` detects TikTok, YouTube, Reddit, X, Creative Center, trend-intelligence articles, and unknown sources.
6. `scrapePolicy.ts` calls `scrape_as_markdown` and marks evidence as `ok`, `partial`, `metadata_only`, or `failed`.
7. `socialEnrichment.ts` enriches direct TikTok videos with structured post/comment data.
8. `evidenceRelevance.ts` revalidates sources after enrichment.
9. `trendAnalyzer.ts` clusters and scores domain-neutral creative formats.
10. `trendDynamics.ts` calculates versioned velocity and saturation.
11. `llm.ts` synthesizes the final strategy, with profile-specific deterministic fallback.
12. `reportRenderer.ts` writes Markdown, JSON, and an HTML dashboard.

## Real Failure Modes Actually Hit

- **Social pages returned thin scrape content.** TikTok and YouTube social pages often returned little public scrapeable text. The agent now keeps those as `metadata_only` instead of pretending they are full scrapes.
- **Generic platform results polluted the evidence.** Search returned TikTok homepage, App Store, and Wikipedia pages. I added relevance filtering to remove those low-value sources.
- **Malformed LLM JSON.** Anthropic returned invalid JSON in live runs. The agent falls back to deterministic trend scoring and concept generation.
- **Encoding artifacts.** Some search/scrape snippets contained mojibake. I added text repair before rendering.
- **Regional evidence can be thin.** The report shows uncertainty notes when location evidence is weak or mostly metadata-based.
- **MCP errors can arrive as `isError` results.** The wrapper now converts them to real exceptions so telemetry is truthful.
- **Discover rejected city targeting.** Country and language are passed through official fields; city remains in the query.
- **Structured captions contradicted SERP snippets.** Post-enrichment revalidation removes misleading videos.
- **Old scoring reports produced false velocity.** Historical comparison now requires analysis version `2.0` and at least 12 hours between runs.
- **Profile region contamination.** Region is inferred from each profile unless explicitly supplied.

## Live Validation

The final live validation used:

- `search_engine`
- `discover`
- `scrape_as_markdown`

It produced a live sample report for the local cafe profile. The report recommended a **Local hidden gem** / **Cozy work-study POV** direction, with a phone-shot vertical concept, hook, caption, scene plan, shot list, and future video-pipeline payload.

I also validated two additional profiles:

- **Maya Moves**, a boutique fitness coach, which produced a practical desk-stretch/listicle concept.
- **LedgerPilot**, a B2B AI bookkeeping SaaS, which produced a non-obvious admin-chaos-to-AI-calm concept.

Those runs exposed real source-quality problems and led to stricter TikTok-first filtering, stable profile-specific demo scripts, and ranked-trend backfill. Details are in:

```text
AGENT_2_SOURCE_QUALITY_VALIDATION.md
```

The production upgrade path is documented in:

```text
AGENT_2_BRIGHT_DATA_PRO_UPGRADE_PATH.md
```

Committed sample output:

```text
agent-2-trend-video-agent/runs/sample-report.md
agent-2-trend-video-agent/runs/sample-report.json
agent-2-trend-video-agent/runs/sample-dashboard.html
```

## MoneyPrinterTurbo Compatibility

I did not integrate MoneyPrinterTurbo in MVP. That keeps the Bright Data assignment focused on live-web agent behavior.

Instead, the JSON report includes `futureVideoPipelineDraft`, containing the video subject, language, vertical aspect ratio, voiceover/script text, scene plan, material keywords, caption, music mood, and production mode.

## Why Agent 2 Is More Demo-Friendly Than Agent 1

Agent 1 is a strong product-decision agent. Agent 2 is more visual, consumer-facing, and instantly understandable in a Loom:

- the user profile is familiar
- the evidence comes from recognizable social platforms
- the output is a video idea someone can shoot
- the failure modes are real and easy to explain
- the optional MoneyPrinterTurbo bridge makes the architecture feel extensible

## What I Would Improve Next

- Schedule recurring collection so velocity becomes a real multi-period signal for every profile.
- Add structured YouTube and Reddit enrichment beside the implemented TikTok datasets.
- Add creator-profile analysis and stronger comment theme/sentiment clustering.
- Add a weekly trend monitor by niche/location.
- Add a human review UI for accepting/rejecting evidence.
- Add direct export to MoneyPrinterTurbo once the creative brief format stabilizes.
