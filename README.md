# Bright Data Agentic GTM Assignment

This repository contains both deliverables for the Bright Data AI Engineer home assignment.

## Structure

- `part-1-agent/` - Agent Ecosystem Opportunity Radar, a runnable Bright Data MCP decision agent.
- `part-2-competitor-memo.md` - One-page memo on Firecrawl's competitive position.
- `PART_1_AGENT_WRITEUP.md` - Detailed Part 1 explanation and additional requirement coverage.
- `PART_2_COMPETITOR_MEMO_WRITEUP.md` - Detailed Part 2 explanation and memo reasoning.
- `MISSION_1_IDEA_COMPARISON.md` - 10-parameter comparison of the old and new Mission 1 ideas.
- `SUBMISSION_EVALUATION.md` - Reviewer-style self-evaluation and requirement coverage.

## Quick Start

```powershell
cd part-1-agent
npm install
Copy-Item .env.example .env
# Fill BRIGHT_DATA_API_TOKEN and either ANTHROPIC_API_KEY or OPENAI_API_KEY in .env
npm run demo:live
```

Custom run:

```powershell
npm run demo -- --company "Bright Data" --decision "next coding-agent integration"
```

The agent writes a Markdown report and JSON payload to `part-1-agent/runs/`.

The committed sample report in `part-1-agent/runs/sample-report.md` was generated from a live run and uses `search_engine`, `discover`, and `scrape_as_markdown`.

## Video Walkthrough

Recommended Loom flow:

1. Show the assignment structure and the agent README.
2. Run `npm run demo:live`.
3. Point out the three Bright Data MCP tools used: `search_engine`, `discover`, and `scrape_as_markdown`.
4. Open the generated decision report and explain the ranking criteria, contradictory signals, and 90-day bet.
5. Close with the real failure modes handled and the key tradeoff.
