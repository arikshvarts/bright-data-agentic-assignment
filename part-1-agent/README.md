# Agent Ecosystem Opportunity Radar

Agent Ecosystem Opportunity Radar is a Bright Data MCP-powered decision agent for technical GTM and product teams.

It answers a concrete product question:

> Which coding-agent ecosystem integration should Bright Data build next, and what exactly should ship in the next 90 days?

This is intentionally narrower than a generic market-research agent. The user is a Head of Product, Developer Relations lead, or technical GTM owner at an agent-infrastructure company. Their job is to decide where limited engineering capacity should go across fast-moving ecosystems such as Codex, Claude Code, Cursor, GitHub Copilot, LangGraph, LangChain, and OpenClaw.

## Run It

```powershell
npm install
Copy-Item .env.example .env
```

Fill in:

```text
BRIGHT_DATA_API_TOKEN=...
ANTHROPIC_API_KEY=...
```

`OPENAI_API_KEY` is also supported. When both keys are present, the agent uses Anthropic first.

Then run the live assignment demo:

```powershell
npm run demo:live
```

Custom decision:

```powershell
npm run demo -- --company "Bright Data" --decision "next coding-agent integration" --max-sources 8
```

Outputs are written to `runs/report-*.md` and `runs/report-*.json`.

## What It Produces

The report is a ranked decision artifact:

- current Bright Data coverage so the agent does not recommend generic work that already exists
- competitor/comparable shipped signals, including what works and what is weak
- ranked integration opportunities
- evidence strength
- developer pain
- adoption signal
- implementation effort
- priority
- evidence URLs
- contradictory signals
- one recommended 90-day bet

The recommended bet includes:

- target developer
- problem solved
- why now
- minimum viable scope
- success metric
- what not to build yet

## Bright Data MCP Tools Used

The live agent uses three Bright Data MCP tools:

- `search_engine` for broad current web discovery.
- `discover` for AI-ranked source discovery.
- `scrape_as_markdown` for evidence extraction.

This exceeds the assignment requirement of at least two distinct Bright Data MCP tools.

## How It Works

1. Plans focused queries around coding-agent ecosystems, official integrations, developer pain, competitors, and MCP/tool interoperability.
2. Calls Bright Data MCP `search_engine` and `discover`.
3. Normalizes and deduplicates sources.
4. Interleaves `discover` and `search_engine` results so one tool does not dominate the evidence set.
5. Scrapes selected evidence with `scrape_as_markdown`.
6. Filters obvious wrong-product sources such as unrelated Bright-* entities.
7. Detects current Bright Data coverage and competitor/comparable shipped signals.
8. Scores ecosystem signals deterministically before synthesis.
9. Uses an LLM to reconcile evidence into a ranked decision report.

## Real Failure Modes Handled

I hit these while building:

- MCP request timeout during Bright Data server initialization/tool calls.
- Partial scrape where a page returned less than 400 characters.
- Anthropic-vs-OpenAI mismatch because the local `.env` used an Anthropic key.
- npm/npx network restriction in the sandbox.
- PowerShell/npm argument forwarding issues.

The code handles those concretely:

- MCP connection and tool-call timeouts are extended.
- Scrapes are classified as `ok`, `partial`, or `failed`.
- Failed/partial sources are retained in the evidence log with sanitized errors.
- The agent exits if fewer than three usable evidence sources remain.
- Both Anthropic and OpenAI are supported.
- `npm run demo:live` gives a reliable one-command demo path.

## Biggest Tradeoff

I chose free-tier reproducibility over maximum data richness. Bright Data Pro Mode and structured datasets would make the intelligence deeper, but the assignment needs a runnable submission with a free account. `search_engine`, `discover`, and `scrape_as_markdown` keep the demo accessible while still proving live MCP orchestration.

## Tests

```powershell
npm test
npm run typecheck
npm run build
npm audit
```

The unit and mocked end-to-end tests do not require Bright Data or LLM credentials.
