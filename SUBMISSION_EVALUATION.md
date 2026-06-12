# Submission Evaluation

This is a candid reviewer-style evaluation for the Bright Data AI Engineer home assignment as of June 12, 2026.

## Overall Assessment

**Current score: 9.3 / 10.**

The submission is strong and live-demo ready. It now includes two working Mission 1 options:

- **Agent 1:** Agent Ecosystem Opportunity Radar, a strategic product/DevRel decision agent.
- **Agent 2:** Trend-to-Video Agent, a TikTok-first creative web agent for location-aware short-form video ideas.

The recommended final demo is **Agent 2** because it is more visual, more creative, easier to understand in a short Loom, and still demonstrates real Bright Data MCP orchestration, source normalization, scrape uncertainty handling, deterministic scoring, LLM synthesis, and fallback behavior.

## 10-Parameter Scorecard

| Parameter | Score | Evaluation |
| --- | ---: | --- |
| Assignment fit | 10/10 | Meets the repo structure, runnable agent, README, memo, and video-readiness requirements. Agent 2 uses three Bright Data MCP tools. |
| Live-web authenticity | 9.5/10 | Agent 2 generated live reports across cafe, fitness, and B2B SaaS profiles using TikTok/YouTube/search evidence from `search_engine`, `discover`, and `scrape_as_markdown`. |
| Agent originality | 9.5/10 | Trend-to-video from business profile, location, trend evidence, and production capabilities is more memorable than a generic research agent. |
| Bright Data MCP usage | 9/10 | Meaningfully composes MCP discovery and scraping tools. Pro/social extractors are documented as a production upgrade path. |
| Failure-mode handling | 9.5/10 | Real failures were hit and handled: metadata-only social pages, generic source pollution, malformed LLM JSON, text encoding artifacts, npm argument forwarding, non-JSON search responses, and weak evidence thresholds. |
| Engineering quality | 8.5/10 | Clean TypeScript modules, typed shapes, tests, build, audit, lockfile, gitignore, sample outputs, and deterministic fallback. |
| Demo quality | 9.5/10 | `npm run demo:live` gives a clear one-command run after env setup. The output is a concrete video concept, not an abstract memo. |
| Current trend awareness | 9/10 | Agent 2 is TikTok-first, validates across TikTok/YouTube/social/search signals, and anticipates optional social extractor and video-pipeline integrations. |
| Competitor memo quality | 9/10 | Firecrawl memo uses current public traction metrics, recent product launches, Bright Data capability awareness, and a differentiated Agent Reliability Kit recommendation. |
| Business judgment | 9/10 | The tradeoff is explicit: free-tier reproducibility over Pro-only social datasets. The next steps are credible and production-oriented. |

## Requirement Coverage

- **Part 1 runnable agent:** Covered by `agent-2-trend-video-agent`; Agent 1 remains in `part-1-agent`.
- **Uses Bright Data MCP:** Covered through spawned `@brightdata/mcp`.
- **At least two distinct MCP tools:** Covered; Agent 2 live run used `search_engine`, `discover`, and `scrape_as_markdown`.
- **Single command after install:** Covered by `npm run demo:live`.
- **Failure mode:** Covered in README, writeup, sample report, and code.
- **README tradeoff and next steps:** Covered.
- **Part 2 memo:** Covered by `part-2-competitor-memo.md`.
- **Submission repo structure:** Covered.
- **Loom video path:** Covered in root README.

## Modern Trend Integration

Agent 2 reflects current creator/social tooling trends:

- Brands and creators increasingly need trend adaptation, not generic trend lists.
- TikTok/Shorts formats move faster than manual social calendars.
- Location and niche fit matter more than raw trend popularity.
- AI video generation is useful only after a strong creative brief exists.
- Social pages are often hard to scrape directly, so metadata retention and source-quality notes matter.
- A future production version should use structured social extractors, engagement signals, creator profiles, comments, and scheduled monitoring.

## Final Recommendation

Submit with Agent 2 as the Mission 1 demo. In the video, lead with:

> "This agent turns live trend evidence into a video idea a real business can shoot today."

Then show the live run, evidence log, ranked trends, recommended concept, metadata-only failure handling, and MoneyPrinterTurbo-compatible future export.
