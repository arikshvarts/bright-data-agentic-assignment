# Trend-to-Video Agent

Trend-to-Video Agent is a Bright Data MCP-powered creative strategy agent for businesses, creators, and social-media managers.

It answers a practical content decision:

> What recent trend should this specific business adapt into a short-form video, and exactly how should they shoot it?

The default demo is TikTok-first because TikTok is the most natural place to show trend-to-video reasoning. YouTube Shorts, Reddit, search results, TikTok Creative Center-style pages, and reputable social/trend-intelligence articles are used as validation signals when available.

## Run It

```powershell
npm install
Copy-Item .env.example .env
```

Fill in:

```text
BRIGHT_DATA_API_TOKEN=...
ANTHROPIC_API_KEY=...
```

`OPENAI_API_KEY` is also supported. When both keys are present, the agent uses Anthropic first.

Then run the live demo:

```powershell
npm run demo:live
```

Additional validation demos:

```powershell
npm run demo:fitness
npm run demo:b2b
```

Custom profile:

```powershell
npm run demo -- --profile-file .\samples\local-cafe.json --location "Tel Aviv, Israel" --goal "drive weekday foot traffic"
```

Outputs are written to `runs/report-*.md` and `runs/report-*.json`.

## What It Produces

- Ranked trend candidates.
- Evidence links to TikTok videos, TikTok Discover pages, YouTube Shorts, or trend-intelligence sources.
- Fit reasoning for the business, audience, location, goal, and capabilities.
- Conflict and uncertainty notes.
- One recommended content opportunity.
- Hook, format, caption, scene plan, shot list, and execution style.
- Recommendation to produce as `human_shot`, `ai_generated`, or `hybrid`.
- AI-video prompt when AI or hybrid production is appropriate.
- Future MoneyPrinterTurbo-style export payload, without rendering video.

## Bright Data MCP Tools Used

The live agent uses three Bright Data MCP tools:

- `search_engine` for broad current trend discovery.
- `discover` for intent-ranked source discovery.
- `scrape_as_markdown` for extracting usable evidence from source URLs.

This exceeds the assignment requirement of at least two distinct Bright Data MCP tools.

## How It Works

1. Loads a creator/business profile from flags or a JSON/Markdown profile file.
2. Plans location-aware TikTok-first trend queries.
3. Calls Bright Data MCP `search_engine` and `discover`.
4. Normalizes, dedupes, platform-classifies, and filters evidence.
5. Scrapes selected sources with `scrape_as_markdown`.
6. Marks evidence as `ok`, `partial`, `failed`, or `metadata_only`.
7. Clusters trend candidates by format/topic signals.
8. Scores candidates by evidence quality, niche fit, location fit, production feasibility, and brand safety.
9. Uses an LLM to synthesize the ranked trends and creative concept.
10. Falls back to a deterministic report if LLM JSON is malformed.
11. Writes Markdown and JSON outputs.

## Real Failure Modes Handled

I hit these while building:

- Social pages returned little scrapeable text.
- Generic TikTok homepage, App Store, and Wikipedia results polluted search output.
- Anthropic sometimes returned malformed JSON during live validation.
- Some scraped/search snippets had broken text encoding.
- Regional evidence was sometimes thin or indirect.

The code handles those concretely:

- Social pages can be retained as `metadata_only` evidence instead of discarded.
- Generic platform/app encyclopedia pages are filtered out.
- The agent exits if fewer than three usable or metadata-valid sources remain.
- LLM synthesis has a deterministic fallback.
- Text is repaired before rendering reports.
- Failure notes are shown in the final report.

## Biggest Tradeoff

The default demo uses Bright Data MCP free-tier-friendly tools for reproducibility. Bright Data Pro/social extractors for TikTok, YouTube, X, and Reddit would improve structured metadata, engagement signals, creator profiles, and comment extraction in a production version.

## MoneyPrinterTurbo Compatibility

This MVP does not render video and does not call MoneyPrinterTurbo.

It includes a future-compatible `futureVideoPipelineDraft` object with the video subject, language, vertical aspect ratio, voiceover/script text, scene plan, material keywords, caption, music mood, and production mode.

## Tests

```powershell
npm test
npm run typecheck
npm run build
npm audit
```

The unit and mocked end-to-end tests do not require Bright Data or LLM credentials.
