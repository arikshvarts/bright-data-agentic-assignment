# Agent 2 Source Quality Validation

Updated: June 18, 2026

This document summarizes the current source-quality policy. Full implementation and live-run details are in `AGENT_2_IMPLEMENTATION_VALIDATION_2026-06-18.md`.

## Evidence Strategy

Agent 2 is TikTok-first, with:

- Direct TikTok videos.
- TikTok Discover pages.
- Bright Data structured TikTok post/comment datasets.
- Reddit community discussions.
- YouTube video evidence.
- Reputable trend and niche articles.

Instagram and Facebook are excluded from the default path because previous live runs produced weaker and less accessible evidence.

## Two-Stage Relevance Validation

Sources are evaluated twice:

1. Before scraping, using URL, title, snippet, niche terms, location, and source type.
2. After scraping/social enrichment, using structured captions and extracted content.

The second stage matters because SERP snippets sometimes described a source as relevant while the actual TikTok caption showed unrelated news or entertainment content.

Evidence is labeled:

- `direct`: niche or location evidence.
- `supporting`: a credible trend surface supporting format interpretation.
- `weak`: rejected.

## Evidence Strength

Evidence does not use a simple source count.

Weights:

- Structured TikTok record: `1.2`
- Successful scrape: `1.0`
- Partial scrape: `0.7`
- Metadata-only social source: `0.35`
- Failed source: `0`

A report requires:

- At least three usable sources.
- Weighted evidence score of at least `1.5`.

One live run stopped with only one usable source and score `0.35`, proving the quality gate works.

## Corroboration

The previous `sourceDiversity` value counted platforms. It now represents independent sources:

- Different TikTok creators.
- Different YouTube channels.
- Different Reddit communities.
- Different web domains.
- Distinct TikTok Discover surfaces.

Platform diversity remains available separately.

## Structured TikTok Evidence

`web_data_tiktok_posts` can add:

- Caption.
- Creator.
- Publication time.
- Views, likes, shares, and comment count.
- Hashtags.
- Video URL.

`web_data_tiktok_comments` can add top readable comments ordered by likes.

These tools were successfully exercised live. The deep social run demonstrated real post and comment dataset collection.

## Current Sample Quality

The committed cafe sample includes:

- A structured Tel Aviv coffee recommendation TikTok.
- A Tel Aviv study-spots Reddit discussion.
- A specialty-coffee trend article.
- Comparable cafe/study discovery surfaces.
- Six retained sources and four ranked trends.
- Real MCP telemetry and an HTML evidence dashboard.

Files:

```text
part-1-agent/runs/sample-report.md
part-1-agent/runs/sample-report.json
part-1-agent/runs/sample-dashboard.html
```

## Live Profiles

### Nook & Pour

- Correct Israel targeting.
- Local study/work and coffee evidence.
- Structured post metrics.
- Four trends.

### Maya Moves

- Correct US targeting.
- Beginner fitness, women-focused training, and fitness-format evidence.
- Structured fitness post.
- No cafe-shaped fallback.

### LedgerPilot

- Correct US targeting.
- Freelancer accounting, invoicing, bookkeeping automation, and creator-finance evidence.
- Structured invoicing post.
- Four trends instead of the previous two.

## Remaining Limits

- TikTok dataset snapshots add latency.
- Discover pages are format evidence, not always local proof.
- Comments are disabled in the fast default and enabled in `demo:deep-social`.
- Reliable time-series velocity needs scheduled repeated runs.
