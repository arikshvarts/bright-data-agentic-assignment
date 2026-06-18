# Agent 2 v2 Implementation and Validation

Date: June 18, 2026

This document records exactly what changed, why it changed, what was tested live, and which claims the current Trend-to-Video Agent can and cannot make.

## Priority Ranking

The requested improvements were implemented in this order:

| Rank | Improvement | Reason for priority | Status |
| --- | --- | --- | --- |
| 1 | Truthful MCP telemetry and failure propagation | A report must not claim a tool succeeded when MCP returned `isError`. | Implemented and live-tested |
| 2 | Region/language propagation and Reddit execution | Incorrect geo targeting invalidates downstream evidence. | Implemented and live-tested |
| 3 | Weighted evidence sufficiency | Three thin URLs should not equal three strong sources. | Implemented and tested |
| 4 | Post-enrichment relevance validation | Structured captions must be able to reject misleading SERP snippets. | Implemented and live-tested |
| 5 | Domain-neutral trends and fallback | B2B/fitness output must not contain cafe shots or copy. | Implemented and live-tested |
| 6 | Independent corroboration | Platform count is not the same as independent evidence. | Implemented and tested |
| 7 | Structured TikTok posts/comments | Adds captions, engagement, hashtags, video URLs, and audience language. | Implemented and live-tested |
| 8 | Velocity and saturation | Claims need measurable basis and explicit uncertainty. | Implemented and tested |
| 9 | Visual evidence dashboard | Makes the agent legible and impressive in a short Loom. | Implemented and generated live |
| 10 | Dependency and CLI hardening | A polished submission needs reproducible commands and a clean audit. | Implemented and tested |

## Exact Runtime Flow

1. `cli.ts` parses profile, location, language, goal, capabilities, source limits, and social-depth controls.
2. `region.ts` infers a country code from the profile location unless `--region` is explicit.
3. `queryPlanner.ts` creates seven queries containing the niche, audience, city/country text, language, goal, TikTok, Creative Center, and Reddit intent.
4. `mcpBrightData.ts` launches `npx -y @brightdata/mcp` with `GROUPS=social`.
5. Four `search_engine` calls receive `geo_location`.
6. Three `discover` calls receive `country`, `language`, intent, duplicate removal, and result count.
7. `sourceNormalizer.ts` converts heterogeneous MCP outputs into one evidence shape and assigns independent source keys.
8. `evidenceRelevance.ts` pre-ranks direct niche/location evidence and supporting trend surfaces.
9. `scrapePolicy.ts` calls `scrape_as_markdown` and assigns `ok`, `partial`, `metadata_only`, or `failed`.
10. `socialEnrichment.ts` optionally calls `web_data_tiktok_posts` and `web_data_tiktok_comments` for direct TikTok videos.
11. Structured captions, authors, dates, metrics, hashtags, video URLs, and comments are merged into evidence.
12. Evidence is revalidated. If structured data contradicts the search snippet, the source can be removed.
13. Evidence sufficiency requires three usable sources and a minimum weighted score. Structured/complete sources count more than metadata-only sources.
14. `trendAnalyzer.ts` clusters domain-neutral formats and calculates fit, validation, independent sources, and platform diversity.
15. `trendDynamics.ts` calculates velocity and saturation.
16. Historical velocity requires analysis version `2.0`, a matching trend name, and reports at least 12 hours apart.
17. Without comparable history, velocity is unknown unless structured date plus engagement supports a labeled snapshot estimate.
18. `llm.ts` asks Anthropic or OpenAI for the final strategy.
19. Invalid model JSON triggers a deterministic, profile-specific fallback.
20. `reportRenderer.ts` produces console, Markdown, JSON, and HTML dashboard outputs.

## Bright Data Tools

### Default live mode

```text
search_engine
discover
scrape_as_markdown
web_data_tiktok_posts
```

### Deep social mode

```text
search_engine
discover
scrape_as_markdown
web_data_tiktok_posts
web_data_tiktok_comments
```

`toolsUsed` is calculated from successful telemetry. Every call records:

- Tool name.
- Success/failure.
- Duration.
- Result count.
- Sanitized error.

## Structured TikTok Integration

For retained direct TikTok URLs, the agent can extract:

- Caption.
- Creator/author.
- Publication timestamp.
- Views.
- Likes.
- Shares.
- Comment count.
- Hashtags.
- Structured video URL.
- Top readable comments, ordered by likes.

The local account successfully ran both structured tools. The deep cafe validation used:

- Two `web_data_tiktok_posts` calls.
- One `web_data_tiktok_comments` call.
- One comment dataset returned 201 records.

The tradeoff is latency: Bright Data dataset snapshots are asynchronous. The deep run took approximately 3.9 minutes; the default mode uses one post and no comments.

## Velocity

The previous implementation inferred `rising` from words such as `2026`, `latest`, or `rising`. That behavior was removed.

Current logic:

- Real run-over-run velocity compares only version-compatible reports at least 12 hours apart.
- It uses score delta and independent-source delta.
- Structured views/day can add engagement context.
- Same-session reruns are excluded.
- Old reports without `analysisVersion: "2.0"` are excluded.
- Without history or structured date/engagement, the label is `unknown`.

## Saturation

Saturation uses:

- Independent sources.
- Platform diversity.
- Number of posts above 500K views.
- Number of TikTok Discover surfaces.

The report explicitly says whether the basis is:

- Historical plus current evidence.
- Current snapshot proxy.

It does not pretend that snapshot saturation is a complete market-share measurement.

## Failure Modes Actually Hit

### MCP `isError` results

Bright Data errors can arrive as MCP results with `isError`, not JavaScript exceptions. The original wrapper treated these as successful text results. The wrapper now throws them, so telemetry and `toolsUsed` are truthful.

### Invalid Discover city

Discover rejected `city: "Tel Aviv"` while accepting country/language. City is now kept in the query text; official `country` and `language` fields are still passed.

### Misleading TikTok search snippets

Initial search selected unrelated news and creator videos. Structured TikTok captions exposed the mismatch. Post-enrichment relevance validation removed those sources.

### Weak evidence

A live run had one source with weighted evidence `0.35`. The agent stopped with remediation instead of producing a weak report.

### Thin social scraping

TikTok pages often produced little Markdown. They are retained as lower-weight `metadata_only` evidence.

### Malformed model JSON

Anthropic returned malformed JSON in multiple live runs. Deterministic synthesis produced valid reports and profile-specific concepts.

### Cross-profile region contamination

An `.env` region made the New York fitness profile query Israel. Region is now inferred from profile location unless explicit.

### Old-model velocity

Comparing old and new scoring models produced false acceleration. Analysis versioning now prevents that.

### npm argument forwarding

The installed npm version stripped custom named flags with one separator. The tested custom form is:

```powershell
npm run demo -- -- --profile-file .\samples\local-cafe.json
```

### Security advisory

`npm audit` reported a high-severity `form-data` advisory on June 18, 2026. `npm audit fix` updated the lockfile. Final audit result: zero vulnerabilities.

## Live Validation Results

### Cafe

Command:

```powershell
npm run demo:live
```

Result:

- Region: `il`.
- Six retained evidence sources.
- Four ranked trends.
- Structured TikTok post with 64K views.
- Local Tel Aviv Reddit study evidence.
- Specialty-coffee trend evidence.
- Markdown, JSON, and HTML dashboard generated.
- Velocity remained unknown where evidence was insufficient.

### Deep Cafe

Command:

```powershell
npm run demo:deep-social
```

Result:

- Structured TikTok posts succeeded.
- Structured TikTok comments succeeded.
- Comment dataset returned real audience text.
- Demonstrated all five Bright Data tools.
- Runtime was several minutes because dataset snapshots were polled.

### Fitness

Command:

```powershell
npm run demo:fitness
```

Result:

- Region correctly inferred as `us`.
- Six relevant fitness sources.
- Structured beginner-fitness TikTok evidence.
- Four generalized trends.
- No cafe-specific fallback language.
- Velocity used a labeled snapshot estimate, not keyword inference.

### B2B Bookkeeping

Command:

```powershell
npm run demo:b2b
```

Result:

- Region correctly inferred as `us`.
- Six relevant sources.
- Evidence included freelancer accounting discussions, bookkeeping automation, invoicing discovery, a creator-bookkeeping guide, and a structured freelancer-invoicing TikTok.
- Four trends were produced, fixing the previous two-trend result.
- No cafe-specific shots or captions.

## Automated Validation

Final commands:

```powershell
npm run typecheck
npm test
npm run build
npm audit
```

Final result:

- 12 test files passed.
- 19 tests passed.
- Typecheck passed.
- Build passed.
- Audit passed with zero vulnerabilities.
- `git diff --check` passed.

## Dashboard

The dashboard includes:

- Evidence count.
- Structured-social count.
- Successful MCP-call count.
- Recommended concept.
- Storyboard.
- Ranked trend cards.
- Velocity and saturation bars with written basis.
- Independent-source and platform counts.
- Evidence ledger with links and metrics.
- Complete MCP execution trace.
- Failure and uncertainty notes.

Committed sample:

```text
part-1-agent/runs/sample-dashboard.html
```

## Remaining Honest Limits

- Structured TikTok datasets add significant latency.
- Snapshot saturation is not equivalent to full-platform market saturation.
- Real velocity becomes strongest after scheduled repeated runs accumulate version-compatible history.
- TikTok Discover pages can still be broad; the report shows location fit and source details rather than hiding that.
- Anthropic JSON reliability is inconsistent, although deterministic fallback is proven.
- The agent does not render video; it exports a future-compatible production payload.
