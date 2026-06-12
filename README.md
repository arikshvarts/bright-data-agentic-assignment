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
4. Point out the three Bright Data MCP tools used: `search_engine`, `discover`, and `scrape_as_markdown`.
5. Open the generated trend-to-video report and explain the ranked trends, evidence links, metadata-only social evidence, and video concept.
6. Close with the real failure modes handled, the free-tier tradeoff, and the future MoneyPrinterTurbo export path.

## Samples

Agent 2 live sample:

```text
agent-2-trend-video-agent/runs/sample-report.md
agent-2-trend-video-agent/runs/sample-report.json
```

Agent 1 live sample:

```text
part-1-agent/runs/sample-report.md
part-1-agent/runs/sample-report.json
```

Both agents use Bright Data MCP `search_engine`, `discover`, and `scrape_as_markdown`.
