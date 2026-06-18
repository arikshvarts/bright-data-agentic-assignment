# Trend-to-Video Agent

Trend-to-Video Agent is a Bright Data MCP-powered creative strategy agent for businesses, creators, and social-media managers.

It answers:

> Which current short-form format fits this business, audience, location, goal, and production capability, and exactly how should it be produced?

The agent is TikTok-first, with Reddit, YouTube, trend-intelligence articles, and TikTok discovery pages used for independent validation.

## Run It

```powershell
npm install
Copy-Item .env.example .env
```

Add:

```text
BRIGHT_DATA_API_TOKEN=...
ANTHROPIC_API_KEY=...
```

`OPENAI_API_KEY` is also supported. Anthropic is preferred when both exist.

Fast live demo:

```powershell
npm run demo:live
```

Deep social demo with two structured TikTok posts and one comment collection:

```powershell
npm run demo:deep-social
```

Additional validated profiles:

```powershell
npm run demo:fitness
npm run demo:b2b
```

Custom profile on this tested Windows/npm setup:

```powershell
npm run demo -- -- --profile-file .\samples\local-cafe.json --location "Tel Aviv, Israel" --goal "drive weekday foot traffic"
```

The additional `--` is required by the installed npm version to forward named options.

## Outputs

Every successful run writes:

- Console decision summary.
- Detailed Markdown report.
- Machine-readable JSON report.
- Responsive HTML evidence dashboard.

Committed sample:

```text
runs/sample-report.md
runs/sample-report.json
runs/sample-dashboard.html
```

## Bright Data MCP Tools

The default live demo uses:

- `search_engine`
- `discover`
- `scrape_as_markdown`
- `web_data_tiktok_posts` when a direct TikTok video is retained

The deep social demo additionally uses:

- `web_data_tiktok_comments`

The MCP server is launched with:

```text
npx -y @brightdata/mcp
GROUPS=social
```

Actual successful tools are derived from execution telemetry. They are not hardcoded.

## Current Flow

1. Parse and validate the business profile.
2. Infer the search country from location unless `--region` is explicit.
3. Build niche, location, language, goal, TikTok, Creative Center, and Reddit queries.
4. Call Bright Data `search_engine` four times with `geo_location`.
5. Call `discover` three times with country and language targeting.
6. Normalize varying MCP result shapes.
7. Classify platforms, canonicalize URLs, and deduplicate.
8. Pre-rank sources by niche/location relevance.
9. Scrape selected sources with `scrape_as_markdown`.
10. Optionally enrich direct TikTok videos with structured post and comment tools.
11. Revalidate evidence using structured captions so misleading search snippets can be rejected.
12. Require at least three sources and a weighted evidence threshold; metadata-only sources count less.
13. Cluster evidence into domain-neutral creative formats.
14. Calculate independent-source corroboration, platform diversity, velocity, and saturation.
15. Use prior version-compatible reports for real run-over-run velocity when they are at least 12 hours apart.
16. Otherwise make no velocity claim, unless publication time plus engagement supports a labeled snapshot estimate.
17. Ask Anthropic/OpenAI for the final strategy.
18. Use deterministic, profile-specific synthesis if model JSON is malformed.
19. Render Markdown, JSON, HTML dashboard, and future video-pipeline export.

## Evidence and Scoring

Evidence statuses:

- `ok`: substantial scrape content.
- `partial`: limited but usable content.
- `metadata_only`: valid social URL with thin public text.
- `failed`: unusable non-social scrape.

Structured TikTok fields can include:

- Caption and creator.
- Publication time.
- Views, likes, shares, and comments.
- Hashtags and video URL.
- High-engagement comment text in deep mode.

Trend candidates expose:

- Evidence, niche, location, production, and brand-safety fit.
- Independent-source count and platform diversity.
- Direct-video, platform-discovery, supporting, or weak validation.
- Velocity score, label, and explicit basis.
- Saturation score, label, and explicit basis.

## Real Failures Encountered

- Discover rejected a city value even though it accepted country/language. City targeting was removed; the city remains in the query.
- MCP tool errors were initially returned with `isError` rather than thrown. The MCP wrapper now converts those results into real failures.
- Search snippets looked relevant while structured TikTok captions revealed unrelated videos. Evidence is revalidated after enrichment.
- Social pages returned little scrapeable text. They are retained as lower-weight `metadata_only` evidence.
- Three metadata-only URLs were not enough for a report. Weighted evidence sufficiency stopped the run.
- Anthropic returned malformed JSON repeatedly. Deterministic synthesis completed the reports.
- Old scoring-model reports produced false acceleration. Time-series comparison is now versioned and excludes same-session runs.
- `.env` region values contaminated other sample profiles. Region is now inferred from each profile unless explicitly supplied.
- npm argument forwarding stripped named options. The documented custom command now uses the tested extra separator.
- A new high-severity `form-data` advisory appeared during validation. `npm audit fix` updated the lockfile; the final audit reports zero vulnerabilities.

## Fast vs Deep Mode

`demo:live` enriches one TikTok post and skips comments. This preserves a meaningful structured-data demonstration while keeping runtime lower.

`demo:deep-social` enriches two posts and one comment collection. Live validation proved that both social tools work, but Bright Data dataset collection is asynchronous and the deep run took several minutes.

## MoneyPrinterTurbo Compatibility

No video is rendered in this MVP. JSON includes `futureVideoPipelineDraft` with:

- Subject and language.
- 9:16 aspect ratio.
- Voiceover/script.
- Scene plan.
- Material keywords.
- Caption and music mood.
- Human-shot, AI-generated, or hybrid mode.

## Validation

```powershell
npm run typecheck
npm test
npm run build
npm audit
```

Current result:

- 12 test files passed.
- 19 tests passed.
- Typecheck passed.
- Build passed.
- Audit passed with zero vulnerabilities.
