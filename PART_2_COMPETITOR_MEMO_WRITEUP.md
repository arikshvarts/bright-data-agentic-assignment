# Part 2 Writeup: Firecrawl Competitive Memo

## What I Wrote

I wrote a one-page leadership memo on **Firecrawl** as Bright Data's competitor in agentic web access.

The memo is in:

```text
part-2-competitor-memo.md
```

It covers:

- why Firecrawl is gaining traction
- where Firecrawl is concretely outflanking Bright Data
- one 90-day bet Bright Data should make

## Why I Picked Firecrawl

I chose Firecrawl because it is one of the clearest developer-mindshare competitors in the agentic web tooling category.

Firecrawl is not stronger than Bright Data on raw infrastructure depth. Bright Data has broader web data infrastructure, proxy depth, scraping capabilities, and structured datasets. Firecrawl's advantage is packaging: it makes the first five minutes feel very simple for agent builders.

That is exactly the competitive position Bright Data needs to understand for the assignment.

## How I Researched It

I used public evidence rather than vibes:

- GitHub repo traction.
- npm weekly download data.
- package metadata.
- MCP setup story.
- docs and onboarding quality.
- apparent agent-community positioning.

The memo includes current metrics checked on June 12, 2026:

- Firecrawl GitHub: about **132k stars / 7.8k forks**.
- Firecrawl MCP server: about **6.5k stars / 753 forks**.
- Bright Data MCP GitHub: about **2.4k stars / 311 forks**.
- `firecrawl-mcp`: **136,850 weekly npm downloads** for 2026-05-27 to 2026-06-02.
- `@brightdata/mcp`: **6,427 weekly npm downloads** for the same period.

Those numbers are not the whole story, but they are a clear signal that Firecrawl is winning disproportionate developer attention around MCP and agent workflows.

## Why the Memo's Argument Matters

The memo argues that Firecrawl is outflanking Bright Data on **activation**, not capability.

Bright Data has the larger platform. Firecrawl has the cleaner "copy this and your agent can use the web" developer story.

That distinction matters because agent builders often choose tools by:

- copying examples from GitHub
- installing packages they see in docs
- looking for fast MCP setup
- following community momentum
- preferring simple mental models under time pressure

If Bright Data wants more adoption across Codex, Claude Code, Cursor, Copilot, LangGraph, and similar environments, the product packaging needs to meet developers where they already are.

## The 90-Day Bet

The memo recommends a **Bright Data Agent Reliability Kit**.

The bet is to make Bright Data's infrastructure advantage visible and measurable for agent builders:

- goal-level orchestration recipes such as `reliable_discover`, `reliable_retrieve`, `reliable_extract`, and `reliable_interact`
- retries, fallbacks, provenance, budget limits, and structured failure states on top of existing MCP tools
- a frozen eval set for blocked pages, JavaScript-rendered pages, geo-dependent content, partial scrapes, ambiguous input, and malformed responses
- a production-grade competitive signal agent with LangGraph and plain TypeScript examples
- a Firecrawl baseline comparison across task completion, citation accuracy, latency, cost, and failure explanations
- Skills and starter configs for Claude Code, Cursor, Codex, Copilot, and VS Code
- short outcome-led demos and a `create-brightdata-agent` scaffold

I added a modern trend pack recommendation too:

- production-scaling examples
- eval frameworks
- security/governance patterns
- token-cost controls
- MCP interoperability recipes

## Why This Recommendation Is Actionable

The recommendation is intentionally concrete enough for a 90-day product/GTM sprint.

It does not require Bright Data to rebuild its core infrastructure. It requires packaging the existing toolset into a more credible production-adoption story:

- fewer decisions before first success
- more copy-paste runnable examples
- clearer proof of when Rapid/free tools are enough and when Pro-mode depth matters
- proof that Bright Data handles messy real web conditions better than simpler tools

## How It Complements Part 1

Part 1 is a working example of the same strategic recommendation.

Agent Ecosystem Opportunity Radar is an example of the same recommendation:

- it uses Bright Data MCP
- it creates a useful business artifact
- it handles real web failures
- it is runnable from a single command
- it demonstrates live web access as agent infrastructure

That makes the submission cohesive: the competitor memo says Bright Data should prove agent reliability with outcome-led demos and evals, and Part 1 shows one such production-shaped agent.

## What I Would Improve Next

With more time, I would:

- add a table comparing Firecrawl, Bright Data MCP, Apify, and Exa/Tavily-style web tools
- collect historical npm/GitHub trend data rather than one current snapshot
- test first-run time for Firecrawl MCP vs. Bright Data MCP
- compare docs friction by counting steps to first successful agent run
- add screenshots or citations from docs pages for onboarding analysis
