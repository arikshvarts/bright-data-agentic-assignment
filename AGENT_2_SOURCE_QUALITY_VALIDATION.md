# Agent 2 Source Quality Validation

Date: June 12, 2026

This document records the practical evidence-quality improvements made after live testing the Trend-to-Video Agent.

## Research-Informed Direction

The agent is now intentionally **TikTok-first** rather than generic social-first.

Why:

- TikTok Creative Center/TikTok One emphasizes trends, top-performing ads, creative triggers, audience relevance, creator content, and AI-assisted creative production.
- Exolyt positions TikTok trend work around social listening, trends, accounts, videos, audience insights, UGC sentiment, influencer discovery, and content ideation.
- Brandwatch represents the broader enterprise pattern: social listening and consumer intelligence are useful, but they are heavier than the assignment MVP.
- MoneyPrinterTurbo is a future pipeline target, so Agent 2 should output a strong creative brief and scene plan before any rendering is attempted.

Sources reviewed:

- https://ads.tiktok.com/business/creativecenter/
- https://exolyt.com/
- https://www.brandwatch.com/
- https://github.com/harry0703/MoneyPrinterTurbo

## What Was Improved

### 1. Removed Instagram From Default Evidence

Instagram links were often less reliable in the free-tier scrape flow, so the default evidence strategy now uses:

- TikTok videos
- TikTok Discover pages
- YouTube Shorts when relevant
- Reddit/search only as supporting discovery
- reputable trend-intelligence pages

Instagram/Facebook URLs are filtered out by default.

### 2. Stronger Source Relevance Filtering

Live runs exposed low-quality or off-brand evidence:

- generic TikTok homepage
- App Store / Google Play pages
- Wikipedia
- dictionary pages
- generic marketing pages
- unrelated city TikTok Discover pages
- off-brand entertainment/sports/history accounts

The agent now filters these before scraping. For local business profiles, TikTok evidence must show the target city in stable text such as the URL or title, not only in a noisy snippet.

### 3. Better Handling of Social Pages

TikTok/YouTube pages often return little scrapeable text. Instead of treating that as a total failure, the agent marks them:

```text
metadata_only
```

This keeps the URL, title, snippet, platform, source type, and uncertainty note visible in the report.

### 4. Ranked Trend Backfill

During live validation, the LLM sometimes returned fewer than three trends. The agent now backfills missing rankings from deterministic trend scoring so the report still has a complete trend set.

### 5. Stable Demo Scripts

PowerShell/npm argument forwarding caused one attempted profile run to silently use the default profile. To avoid that, the package now includes explicit scripts:

```powershell
npm run demo:live
npm run demo:fitness
npm run demo:b2b
```

## Live Profiles Tested

### Local Cafe: Nook & Pour

Command:

```powershell
npm run demo:live
```

Outcome:

- Produced a cleaner TikTok/YouTube evidence set around Tel Aviv cafes, coworking cafes, coffee spots, and study/work locations.
- Removed earlier bad sources such as Instagram, App Store, Wikipedia, dictionary pages, Cyberjaya/Adana/Leipzig Discover pages, and off-brand entertainment trends.
- Recommended **Local hidden gem** / **Cozy work-study POV**.
- Final committed sample:

```text
agent-2-trend-video-agent/runs/sample-report.md
agent-2-trend-video-agent/runs/sample-report.json
```

### Fitness Coach: Maya Moves

Command:

```powershell
npm run demo:fitness
```

Outcome:

- Found TikTok evidence around beginner strength, office-worker mobility, women-focused strength training, and low-equipment workouts.
- Generated a practical concept: **3 Desk Stretches That Actually Fix Office Posture**.
- The run exposed weak source patterns from sports/entertainment and history accounts, which were added to the noisy-source filter.
- The report explicitly noted weak regional evidence for New York and lowered confidence accordingly.

### B2B SaaS: LedgerPilot

Command:

```powershell
npm run demo:b2b
```

Outcome:

- Found TikTok evidence around receipt workflows, invoice tracking, QuickBooks-style small-business expense content, and AI expense trackers.
- Generated a non-obvious B2B creative concept: **Month-End Chaos AI Calm: Freelancer Admin Transformation**.
- The output used screen recordings and founder on-camera footage rather than forcing a consumer-style trend.
- The report correctly noted metadata-thin evidence and regional weakness.

## What Still Needs Pro Mode

The free-tier MCP tools are enough for a reproducible assignment demo, but production quality would improve with Bright Data Pro/social extractors:

- structured TikTok video metadata
- engagement counts
- creator profile extraction
- comment extraction
- sound/hashtag extraction
- location and language metadata
- trend velocity across runs

That is the clearest next step for using more of Bright Data's core advantage.
