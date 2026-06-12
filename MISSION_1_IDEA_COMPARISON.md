# Mission 1 Idea Comparison

## Summary

The repo now contains two Mission 1 options:

- **Agent 1:** Agent Ecosystem Opportunity Radar, a product/DevRel decision agent.
- **Agent 2:** Trend-to-Video Agent, a TikTok-first social trend agent for location-aware video concepts.

The recommended final demo is **Agent 2** because it is more visual, creative, and immediately understandable while still satisfying the Bright Data MCP requirements.

## 10-Parameter Comparison

| Parameter | Agent 1: Ecosystem Radar | Agent 2: Trend-to-Video Agent | Winner |
| --- | --- | --- | --- |
| Assignment fit | Strong Bright Data MCP decision agent. | Strong Bright Data MCP creative web agent. | Tie |
| Demo clarity | Requires product/DevRel context. | Instantly understandable: business profile to video idea. | Agent 2 |
| Bright Data relevance | Shows research and integration strategy. | Shows live-web/social evidence extraction under messy conditions. | Agent 2 |
| Creativity | Strategic but B2B/niche. | More visual, consumer-facing, and memorable. | Agent 2 |
| Evidence quality | Docs/GitHub/platform evidence. | Social/video/trend evidence, plus uncertainty handling. | Tie |
| Failure handling | Timeout, partial scrape, malformed LLM, wrong-product results. | Metadata-only social pages, generic source pollution, malformed LLM, encoding repair. | Agent 2 |
| Business value | Helps prioritize integrations. | Helps creators/businesses produce timely content. | Agent 2 |
| Reviewer appeal | Shows strategic thinking. | Shows agent creativity and a production-quality vertical slice. | Agent 2 |
| Extensibility | Monitoring, evals, integration kits. | Pro social extractors, scheduling, MoneyPrinterTurbo export. | Agent 2 |
| Risk | More stable source ecosystem. | Social trend evidence is messier and harder to scrape. | Agent 1 |

## Scores

| Idea | Score |
| --- | ---: |
| Agent 1: Ecosystem Opportunity Radar | 9.1/10 |
| Agent 2: Trend-to-Video Agent | 9.3/10 |

## Why Agent 2 Wins for the Final Demo

Agent 2 is more likely to impress in a short assignment review because the workflow is concrete:

```text
business profile -> live trend evidence -> ranked trends -> video concept -> script/scene plan
```

It still demonstrates engineering judgment: source normalization, social-page scrape failure handling, metadata-only evidence, relevance filtering, deterministic scoring, LLM fallback, and a future video-pipeline export shape.

## Remaining Weaknesses

- Social evidence can be noisy or metadata-only without Pro/social extractors.
- Trend scoring is heuristic rather than benchmarked against actual performance.
- Engagement metrics and comments are not structured in the free-tier MVP.
- MoneyPrinterTurbo is only prepared as an export contract, not integrated.

Those are acceptable tradeoffs for a polished assignment vertical slice.
