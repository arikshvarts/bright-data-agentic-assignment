# Part 1 Writeup: Agent Ecosystem Opportunity Radar

## What I Built

I rebuilt Mission 1 as **Agent Ecosystem Opportunity Radar**, a Bright Data MCP-powered decision agent.

Instead of answering a broad research prompt like "generate GTM plays for a market," it answers a concrete product decision:

> Which coding-agent ecosystem integration should Bright Data build next, and what exactly should ship in the next 90 days?

The target user is a Head of Product, Developer Relations lead, or technical GTM owner at an agent-infrastructure company. They need to decide where limited engineering capacity should go across ecosystems such as Codex, Claude Code, Cursor, GitHub Copilot, LangGraph, LangChain, and OpenClaw.

## Why I Changed the Idea

The previous version solved a real but broad problem: technical GTM teams need to monitor fragmented market signals. The weakness was that the output could look like generic LLM market research.

The new version is a decision agent. It makes the operational pain concrete:

- **Who needs it:** product, DevRel, and technical GTM leaders.
- **Decision:** which coding-agent ecosystem/integration deserves engineering capacity next.
- **Manual work replaced:** checking official docs, GitHub repos, MCP directories, competitor examples, and developer discussions.
- **Cost of wrong decision:** spending a quarter on an integration that does not unlock adoption.
- **Why search/ChatGPT is insufficient:** evidence is fragmented, conflicting, and often unclear about official support vs. community claims.

## What It Outputs

The report is a ranked integration-decision artifact:

- current Bright Data coverage, so recommendations do not duplicate existing docs or integrations
- competitor/comparable analysis: what they shipped, what works well, what is weak, and what Bright Data should learn
- ranked integration opportunities
- ecosystem
- evidence strength
- developer pain
- adoption signal
- implementation effort
- priority
- rationale
- evidence URLs
- contradictory signals
- one recommended 90-day bet

The 90-day bet includes:

- target developer
- problem solved
- why now
- minimum viable scope
- success metric
- what not to build yet

## How It Works

1. `queryPlanner.ts` creates focused queries around Bright Data, coding-agent ecosystems, MCP/tool interoperability, official docs, developer pain, and competitor presence.
2. `agent.ts` calls Bright Data MCP `search_engine` and `discover`.
3. `sourceNormalizer.ts` normalizes different result shapes into `EvidenceSource`.
4. The agent interleaves `discover` and `search_engine` results to avoid one-source bias.
5. `scrapePolicy.ts` calls `scrape_as_markdown` and classifies each source as `ok`, `partial`, or `failed`.
6. `agent.ts` filters obvious wrong-product matches such as unrelated Bright-* entities.
7. `evidenceScorer.ts` detects current Bright Data coverage, competitor/comparable shipped signals, and deterministic ecosystem scores.
8. `llm.ts` asks Anthropic/OpenAI to reconcile the evidence into a decision artifact.
9. If the LLM returns malformed JSON, the agent falls back to a deterministic report built from the scored evidence.
10. `reportRenderer.ts` writes Markdown and console summaries.

## Additional Requirement Coverage

### Uses at Least 2 Distinct Bright Data MCP Tools

The live agent uses **three** Bright Data MCP tools:

- `search_engine`
- `discover`
- `scrape_as_markdown`

The final live validation showed all three tools executing successfully.

### Runnable End-to-End With a Single Command

After `npm install` and `.env` setup:

```powershell
npm run demo:live
```

That command runs the full flow:

- starts Bright Data MCP
- discovers sources
- scrapes selected pages
- scores ecosystems
- generates Markdown and JSON reports

Custom command:

```powershell
npm run demo -- --company "Bright Data" --decision "next coding-agent integration" --max-sources 8
```

### Handles Real Failure Modes Actually Hit

I hit and handled these real failures:

- **MCP timeout:** Bright Data MCP initialization/tool calls hit the SDK timeout. I extended connection/tool timeouts and reset timeout on progress.
- **Partial scrape:** some pages returned thin content. The agent marks them `partial` and keeps them visible in the evidence log.
- **Malformed LLM response:** Anthropic returned invalid JSON during live validation. I added a deterministic fallback report path so the agent still completes from collected evidence.
- **Wrong-product ambiguity:** search returned unrelated Bright-* results such as Bright MLS and a film page. I added relevance filtering so those do not contaminate the recommendation.
- **LLM provider mismatch:** the local `.env` used Anthropic while the first version only supported OpenAI. The agent now supports both.
- **npm/npx network restriction:** Bright Data MCP needed network approval in the sandbox.
- **PowerShell/npm argument forwarding:** I added `npm run demo:live` so the demo has a reliable one-command path.

This is not just wrapping code in `try/catch`. The agent changes behavior based on failure quality: it continues with partial evidence when enough remains, refuses weak evidence sets, and falls back to deterministic scoring when synthesis fails.

## Final Live Validation

The final successful live report used:

- `search_engine`
- `discover`
- `scrape_as_markdown`

It produced a recommendation to build a first-party **GitHub Copilot integration kit**, with Cursor, Codex, and Claude Code ranked behind it based on the selected evidence.

The committed sample output is:

```text
agent-1-ecosystem-radar/runs/sample-report.md
agent-1-ecosystem-radar/runs/sample-report.json
```

## Biggest Tradeoff

I kept the implementation free-tier compatible rather than using Bright Data Pro Mode or structured datasets. That makes the assignment easier to run and review, while still demonstrating live web access, MCP orchestration, source normalization, scrape failure handling, deterministic scoring, and LLM synthesis.

## What I Would Ship Next

- Source-quality classifier that distinguishes official docs, community claims, SEO pages, and competitor marketing.
- More targeted ecosystem-specific query fanout for Codex, Claude Code, Cursor, Copilot, LangGraph, and LangChain.
- GitHub API enrichment for stars, recent commits, issues, and discussions.
- Historical trend comparison across runs.
- A reviewer UI for accepting/rejecting evidence before final synthesis.
