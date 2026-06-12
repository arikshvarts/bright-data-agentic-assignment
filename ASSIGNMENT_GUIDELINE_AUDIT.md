# Assignment Guideline Audit

Date: June 12, 2026

This file maps the Bright Data AI Engineer assignment requirements to the actual repo implementation and the practical checks I ran. It is intentionally explicit so a reviewer can see what was verified live and what remains a future improvement.

## Executive Summary

The repo now contains two runnable Bright Data MCP agents:

- **Recommended Mission 1 demo:** `agent-2-trend-video-agent/`
- **Preserved previous Mission 1 agent:** `part-1-agent/` and `agent-1-ecosystem-radar/`

Agent 2 is the recommended submission path because it is more visual and demo-friendly:

```text
business profile -> live social trend evidence -> ranked trends -> video concept -> script/scene plan
```

It stays inside the assignment scope: it is a web agent, uses Bright Data MCP as the live-web infrastructure, composes multiple MCP tools, handles real web uncertainty, and produces Markdown/JSON outputs from a one-command CLI.

## Requirement-by-Requirement Coverage

| Assignment requirement | Practical coverage | Evidence |
| --- | --- | --- |
| Build a production-quality web agent | Agent 2 is a typed Node/TypeScript CLI with profile parsing, Bright Data MCP orchestration, source normalization, scrape policy, trend scoring, LLM synthesis, fallback synthesis, Markdown/JSON outputs, and tests. | `agent-2-trend-video-agent/src/` |
| Use Bright Data MCP server | Agent 2 spawns Bright Data MCP with `npx -y @brightdata/mcp`. | `agent-2-trend-video-agent/src/mcpBrightData.ts` |
| Use at least two distinct Bright Data MCP tools | Agent 2 uses three tools: `search_engine`, `discover`, and `scrape_as_markdown`. | Live run console and `toolsUsed` in sample report |
| Runnable end-to-end with one command after install/env setup | `npm run demo:live` runs the full live flow. | `agent-2-trend-video-agent/package.json` |
| Handle at least one real failure mode actually hit | Agent 2 handles metadata-only social pages, generic source pollution, malformed LLM JSON, broken text encoding, and weak evidence. These were encountered during live validation, not invented after the fact. | `scrapePolicy.ts`, `agent.ts`, `llm.ts`, `textRepair.ts`, sample report failure notes |
| Produce clear output | Agent 2 writes console summary, Markdown report, and JSON report. | `agent-2-trend-video-agent/runs/sample-report.md` and `.json` |
| Include evidence and links | The sample report includes TikTok/Instagram evidence URLs and an evidence log with source status. | `agent-2-trend-video-agent/runs/sample-report.md` |
| Explain tradeoff | The README and report explain the free-tier reproducibility tradeoff versus Pro/social extractors. | `agent-2-trend-video-agent/README.md`, sample report |
| Keep deliverables organized | The root README explains Agent 2, Agent 1, Part 2 memo, writeups, comparison, and evaluation. | `README.md` |
| Part 2 competitor memo | Firecrawl memo exists with current metrics, recent launches, and a 90-day Bright Data recommendation. | `part-2-competitor-memo.md` |

## Practical Checks Run

Agent 2 checks actually run:

```powershell
cd agent-2-trend-video-agent
npm install
npm run typecheck
npm test
npm run build
npm audit
npm run demo:live
```

Results:

- `npm install`: passed; 0 vulnerabilities after audit.
- `npm run typecheck`: passed.
- `npm test`: passed, 8 test files and 9 tests.
- `npm run build`: passed.
- `npm audit`: passed, 0 vulnerabilities.
- `npm run demo:live`: passed with live Bright Data MCP.

The live run used:

- `search_engine`
- `discover`
- `scrape_as_markdown`

The final committed sample output is:

```text
agent-2-trend-video-agent/runs/sample-report.md
agent-2-trend-video-agent/runs/sample-report.json
```

Agent 1 checks were previously run and passed:

```powershell
cd part-1-agent
npm run typecheck
npm test
npm run build
npm audit
npm run demo:live
```

The preserved Agent 1 copy exists in `agent-1-ecosystem-radar/` without local `.env`, `node_modules`, or `dist`.

## Real Failure Modes Hit and How They Were Handled

| Failure actually hit | What happened | Handling added |
| --- | --- | --- |
| Social pages returned little scrapeable text | TikTok/Instagram pages often returned empty or tiny scrape output. | Keep source as `metadata_only`, preserve URL/snippet, show uncertainty in report. |
| Generic platform results polluted evidence | Search returned TikTok homepage, App Store, and Wikipedia pages. | Relevance filtering excludes generic platform/app/encyclopedia pages. |
| Malformed LLM JSON | Anthropic returned invalid JSON during live runs. | Deterministic fallback report from scored trend candidates. |
| Encoding artifacts | Some snippets had mojibake such as broken cafe/quote characters. | Text repair utility normalizes common mojibake and punctuation before rendering. |
| Weak or indirect regional evidence | Some evidence was location-related but not perfect for the exact business. | Report includes failure/uncertainty notes and confidence values. |
| Secrets in local env | Existing Agent 1 `.env` was needed for live testing but must not be committed. | `.env` ignored; Agent 1 archive excludes `.env`; only `.env.example` committed. |

## What I Did, Step by Step

1. Preserved the original Agent 1 implementation by copying it to `agent-1-ecosystem-radar/`, excluding `node_modules`, `dist`, and `.env`.
2. Created `agent-2-trend-video-agent/` as a new independent TypeScript package.
3. Added CLI inputs for profile file, business name, profile, niche, audience, location, language, goal, capabilities, source limit, and trend limit.
4. Added a default local-cafe sample profile at `samples/local-cafe.json`.
5. Reused the proven Bright Data MCP stdio approach from Agent 1.
6. Added TikTok-first, location-aware query planning.
7. Added source normalization for messy `search_engine` and `discover` result shapes.
8. Added platform classification for TikTok, Instagram, YouTube, Reddit, X, Creative Center, articles, and unknown sources.
9. Added scrape policy with `ok`, `partial`, `failed`, and `metadata_only` statuses.
10. Added trend candidate scoring by evidence quality, niche fit, location fit, production fit, and brand safety.
11. Added LLM synthesis through Anthropic/OpenAI with deterministic fallback.
12. Added Markdown and JSON report rendering.
13. Added future MoneyPrinterTurbo-compatible `futureVideoPipelineDraft` output without rendering video.
14. Added unit tests and mocked end-to-end test.
15. Ran practical validation commands and fixed issues found by TypeScript and live runs.
16. Promoted the best live report to committed `sample-report.md` and `sample-report.json`.
17. Updated root docs, writeups, comparison, and evaluation to make Agent 2 the recommended final demo.
18. Committed all implemented changes locally.

## Agent 1 vs Agent 2: 10-Parameter Comparison

| Parameter | Agent 1: Ecosystem Opportunity Radar | Agent 2: Trend-to-Video Agent | Winner |
| --- | --- | --- | --- |
| Assignment fit | Strong. Uses Bright Data MCP for product-decision research. | Strong. Uses Bright Data MCP for creative trend-to-video research. | Tie |
| Demo clarity | Requires explaining Bright Data/product/DevRel context. | Very easy: business profile goes in, video idea comes out. | Agent 2 |
| Creativity | Strategic and timely around coding agents. | More visual, consumer-facing, and memorable. | Agent 2 |
| Practical user value | Helps prioritize integrations and DevRel bets. | Helps a business produce timely short-form content today. | Agent 2 |
| Bright Data tool usage | Uses `search_engine`, `discover`, `scrape_as_markdown`. | Uses the same three tools, plus a clearer social-web uncertainty story. | Agent 2 |
| Failure handling | Handles timeouts, partial scrape, malformed LLM, wrong-product results. | Handles metadata-only social pages, generic social source pollution, malformed LLM, text artifacts, weak regional signals. | Agent 2 |
| Evidence quality | More stable docs/GitHub/source ecosystem. | More dynamic but messier social/video evidence. | Agent 1 for stability, Agent 2 for realism |
| Business judgment | Strong for Bright Data internal strategy. | Strong for creator/business operations and future video automation. | Tie |
| Extensibility | Can become monitoring/evals/integration-kit product. | Can add Pro social extractors, scheduling, comments, engagement, MoneyPrinterTurbo export. | Agent 2 |
| Reviewer memorability | Solid technical strategy agent. | More likely to stand out in a short review because the output is visual and concrete. | Agent 2 |

Final recommendation: use **Agent 2** for the Loom/demo and keep **Agent 1** as proof of strategic range.

## What Was Not Fully Checked

- I did not push to GitHub because no repository remote is configured and `gh` is not installed.
- I did not test Bright Data Pro/social extractor mode because the MVP is intentionally free-tier reproducible.
- I did not integrate MoneyPrinterTurbo because the plan explicitly keeps video rendering out of MVP.
- I did not benchmark actual TikTok engagement performance; the score is evidence-based, not performance-validated.
- I did not build a web UI; the deliverable is a polished CLI vertical slice.

## GitHub Publishing Status

Local git status:

- Latest commit: `b1dd7bf Add Trend-to-Video Agent`
- Previous commit: `130b1c2 Build Bright Data agentic GTM submission`
- Submission zip regenerated from `HEAD`.

Publishing blocker:

- `https://github.com/arikshvarts` is a GitHub profile URL, not a repository remote.
- This local repo currently has no `origin` remote.
- GitHub CLI `gh` is not installed, so I cannot create/push a repo automatically from this machine.

To publish, create a GitHub repository under `arikshvarts` and provide its clone URL, for example:

```text
https://github.com/arikshvarts/bright-data-agentic-assignment.git
```

Then run:

```powershell
git remote add origin https://github.com/arikshvarts/bright-data-agentic-assignment.git
git push -u origin main
```

Future best practice: commit after each coherent implementation milestone, run checks before each push, and push to GitHub immediately after the commit passes validation.
