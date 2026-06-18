# Bright Data Agentic Assignment

This repository contains the Bright Data AI Engineer home assignment deliverables, plus two Mission 1 agent options.

## Structure

- `agent-2-trend-video-agent/` - **Recommended final Mission 1 demo:** Trend-to-Video Agent, a location-aware social trend agent for short-form video ideas.
- `part-1-agent/` - Original Agent Ecosystem Opportunity Radar, a runnable Bright Data MCP product-decision agent.
- `agent-1-ecosystem-radar/` - Preserved copy of the original Agent 1 implementation.
- `part-2-competitor-memo.md` - One-page memo on Firecrawl's competitive position.
- `PART_1_AGENT_WRITEUP.md` - Detailed writeup for Agent 1.
- `PART_1_AGENT_2_WRITEUP.md` - Detailed writeup for Agent 2.
- `AGENT_2_SOURCE_QUALITY_VALIDATION.md` - Practical live-run validation and source-quality improvements for Agent 2.
- `AGENT_2_BRIGHT_DATA_PRO_UPGRADE_PATH.md` - How Agent 2 should use more of Bright Data's structured/social tool surface next.
- `AGENT_2_IMPLEMENTATION_VALIDATION_2026-06-18.md` - Exact v2 architecture, failures, live tests, and remaining limits.
- `PART_2_COMPETITOR_MEMO_WRITEUP.md` - Detailed Part 2 explanation and memo reasoning.
- `MISSION_1_IDEA_COMPARISON.md` - Comparison of Agent 1 and Agent 2.
- `SUBMISSION_EVALUATION.md` - Reviewer-style self-evaluation and requirement coverage.

## Quick Start

Recommended Agent 2 demo:

```powershell
cd agent-2-trend-video-agent
npm install
Copy-Item .env.example .env
# Fill BRIGHT_DATA_API_TOKEN and either ANTHROPIC_API_KEY or OPENAI_API_KEY in .env
npm run demo:live
```

Optional Agent 2 validation demos:

```powershell
npm run demo:deep-social
npm run demo:fitness
npm run demo:b2b
```

Agent 1 demo:

```powershell
cd part-1-agent
npm install
Copy-Item .env.example .env
# Fill BRIGHT_DATA_API_TOKEN and either ANTHROPIC_API_KEY or OPENAI_API_KEY in .env
npm run demo:live
```

## Recommended Loom Flow

1. Show the repo structure and explain that Agent 2 is the recommended final demo.
2. Open `agent-2-trend-video-agent/README.md`.
3. Run `npm run demo:live` from `agent-2-trend-video-agent`.
4. Point out the default tool composition: `search_engine`, `discover`, `scrape_as_markdown`, and structured `web_data_tiktok_posts`.
5. Open the generated HTML dashboard and show the evidence ledger, real MCP execution trace, velocity/saturation basis, and storyboard.
6. Mention that `npm run demo:deep-social` also calls `web_data_tiktok_comments`, but takes longer because dataset collection is asynchronous.
7. Close with the real failure modes handled and the future MoneyPrinterTurbo export path.

## Samples

Agent 2 live sample:

```text
agent-2-trend-video-agent/runs/sample-report.md
agent-2-trend-video-agent/runs/sample-report.json
agent-2-trend-video-agent/runs/sample-dashboard.html
```

Agent 1 live sample:

```text
part-1-agent/runs/sample-report.md
part-1-agent/runs/sample-report.json
```

Both agents use Bright Data MCP `search_engine`, `discover`, and `scrape_as_markdown`. Agent 2 also integrates Bright Data's structured TikTok post/comment tools through the MCP social group.
