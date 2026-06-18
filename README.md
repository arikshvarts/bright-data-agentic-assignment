# Bright Data Trend-to-Video Agent

[![CI](https://github.com/arikshvarts/bright-data-agentic-assignment/actions/workflows/ci.yml/badge.svg)](https://github.com/arikshvarts/bright-data-agentic-assignment/actions/workflows/ci.yml)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Bright Data MCP](https://img.shields.io/badge/Bright%20Data-MCP-6f42c1)](https://github.com/brightdata/brightdata-mcp)

**An agentic GTM reference implementation built on Bright Data MCP.**

The agent turns a business profile and live TikTok/web evidence into a ranked
content opportunity, a production-ready short-video concept, and an auditable
evidence dashboard.

> A business profile goes in. Current trend evidence, a creative decision,
> and a shootable video plan come out.

![Trend-to-Video evidence dashboard](docs/assets/trend-dashboard-preview.png)

## Why This Is A Bright Data GTM Demo

This repository demonstrates how live web access becomes a customer-facing
agent workflow rather than a standalone scraping call:

- Discover current, location-aware market signals.
- Enrich thin social pages with structured TikTok data.
- Turn messy evidence into a decision a business can act on.
- Expose tool execution, uncertainty, and source quality.
- Produce reusable Markdown, JSON, and HTML artifacts.

The result is useful as a sales demo, solution-engineering reference, MCP
integration example, and foundation for a production content-intelligence
workflow.

## Five-Minute Quick Start

### Requirements

- Node.js 20 or newer
- A [Bright Data account](https://brightdata.com/)
- A Bright Data API token
- Either an Anthropic or OpenAI API key

### 1. Install

```powershell
git clone https://github.com/arikshvarts/bright-data-agentic-assignment.git
cd bright-data-agentic-assignment\part-1-agent
npm install
Copy-Item .env.example .env
```

On macOS or Linux, replace the final command with:

```bash
cp .env.example .env
```

### 2. Configure

Add credentials to `.env`:

```dotenv
BRIGHT_DATA_API_TOKEN=your_bright_data_token
ANTHROPIC_API_KEY=your_anthropic_key

# Alternatively:
# OPENAI_API_KEY=your_openai_key
```

### 3. Run

```powershell
npm run demo:live
```

The command launches Bright Data MCP, runs the complete agent, and writes:

- A concise console decision
- A human-readable Markdown report
- A machine-readable JSON report
- A responsive HTML evidence dashboard

No manual MCP server setup is required.

## Use It With Your Business

Copy one of the profiles in
[`part-1-agent/samples/`](part-1-agent/samples/)
and edit these fields:

```json
{
  "businessName": "Example Company",
  "profile": "What the business or creator does.",
  "niche": "Primary category and offer",
  "audience": "Who the content should reach",
  "location": "New York, United States",
  "language": "English",
  "goal": "increase qualified demo requests",
  "capabilities": [
    "phone-shot vertical video",
    "founder can appear on camera",
    "can record product demonstrations"
  ]
}
```

Run the custom profile:

```powershell
npm run demo -- -- --profile-file .\samples\my-business.json `
  --max-sources 8 `
  --max-trends 5
```

The extra `--` is intentional and preserves named options on the tested npm
and PowerShell setup.

For configuration, output contracts, TypeScript reuse, and production
deployment patterns, see the
[`Integration Guide`](docs/INTEGRATION_GUIDE.md).

## Bright Data MCP Toolchain

| Tool                       | GTM role                                         |
| -------------------------- | ------------------------------------------------ |
| `search_engine`            | Geo-targeted broad discovery                     |
| `discover`                 | Intent-aware country and language ranking        |
| `scrape_as_markdown`       | Evidence extraction and accessibility testing    |
| `web_data_tiktok_posts`    | Captions, dates, creators, metrics, and hashtags |
| `web_data_tiktok_comments` | Audience language, objections, and questions     |

The default demo uses the first four tools.
Deep mode adds structured TikTok comments:

```powershell
npm run demo:deep-social
```

Successful tools are derived from real execution telemetry.
They are not hardcoded into the report.

## How The Agent Works

```mermaid
flowchart LR
    A["Business profile"] --> B["Location and language query plan"]
    B --> C["Bright Data search_engine"]
    B --> D["Bright Data discover"]
    C --> E["Normalize, classify, and deduplicate"]
    D --> E
    E --> F["scrape_as_markdown"]
    F --> G["Structured TikTok enrichment"]
    G --> H["Post-enrichment relevance validation"]
    H --> I["Evidence sufficiency and corroboration"]
    I --> J["Trend fit, velocity, and saturation"]
    J --> K["LLM creative synthesis"]
    K --> L["Markdown, JSON, and HTML dashboard"]
    K -. "Malformed JSON" .-> M["Deterministic fallback"]
    M --> L
```

The implementation deliberately separates:

1. Live-web retrieval through Bright Data MCP.
2. Deterministic evidence validation and scoring.
3. LLM-based creative synthesis.
4. Deterministic recovery if synthesis fails.

See
[`part-1-agent/README.md`](part-1-agent/README.md)
for the complete runtime flow.

## Evidence And Failure Handling

The agent records MCP status, duration, result count, sanitized errors, scrape
state, relevance tier, independent-source count, and the explicit basis for
velocity and saturation.

Real failure modes handled during development include:

- MCP failures returned as `isError` results instead of exceptions
- Invalid city targeting in `discover`
- TikTok pages with little publicly scrapeable text
- Search snippets contradicted by structured TikTok captions
- Evidence sets containing only thin metadata
- Malformed LLM JSON
- Cross-profile region contamination
- False velocity caused by incompatible historical scoring versions

The agent refuses to produce a report when fewer than three usable sources or
insufficient weighted evidence remain.

## Sample Output

- [Readable report](part-1-agent/runs/sample-report.md)
- [Structured JSON](part-1-agent/runs/sample-report.json)
- [HTML dashboard source](part-1-agent/runs/sample-dashboard.html)

The committed sample includes six evidence sources, four ranked
opportunities, structured TikTok metrics, 14 recorded MCP calls, and no
embedded credentials.

## Integration Surfaces

| Surface                    | Intended use                                                 |
| -------------------------- | ------------------------------------------------------------ |
| Profile JSON               | Feed a CRM, onboarding form, or account brief into the agent |
| Report JSON                | Send recommendations to a content calendar or internal API   |
| Markdown                   | Human review, handoff, and approval                          |
| HTML dashboard             | Sales demo, stakeholder review, and evidence inspection      |
| `futureVideoPipelineDraft` | Connect to a script, asset, or video renderer                |
| MCP telemetry              | Observability, reliability analysis, and cost controls       |

The JSON contract is intentionally richer than the visual report so another
agent or service can reuse the evidence, recommendation, shot list, and
future video payload without scraping the dashboard.

## Submission At A Glance

| Mission    | Deliverable                            | Start here                                                                          |
| ---------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| Mission 1  | Production-grade Bright Data web agent | [`part-1-agent/`](part-1-agent/)                                                    |
| Mission 2  | Firecrawl competitive-position memo    | [`part-2-competitor-memo.md`](part-2-competitor-memo.md)                            |
| Validation | Live tests, failures, and limitations  | [`Implementation validation`](docs/AGENT_2_IMPLEMENTATION_VALIDATION_2026-06-18.md) |
| Review     | Requirement-by-requirement mapping     | [`Assignment audit`](docs/ASSIGNMENT_GUIDELINE_AUDIT.md)                            |

The earlier Agent Ecosystem Opportunity Radar remains in
[`agent-1-ecosystem-radar/`](agent-1-ecosystem-radar/) as an alternative
concept.
The Trend-to-Video Agent is the recommended evaluation path.

## Verified Repository Health

| Check                                | Result                    |
| ------------------------------------ | ------------------------- |
| TypeScript typecheck                 | Passed                    |
| Unit and mocked E2E tests            | 19 passed across 12 files |
| Production build                     | Passed                    |
| Dependency audit                     | 0 vulnerabilities         |
| Live cafe, fitness, and B2B profiles | Passed                    |
| Structured TikTok posts              | Passed live               |
| Structured TikTok comments           | Passed live in deep mode  |
| Desktop and mobile dashboard QA      | Passed                    |

GitHub Actions repeats typecheck, tests, build, and dependency auditing for
both runnable agent packages.

Run the same checks locally:

```powershell
cd part-1-agent
npm run check
```

## Repository Map

```text
.
|-- part-1-agent/                # Mission 1 Trend-to-Video implementation
|-- agent-1-ecosystem-radar/     # Preserved alternative concept
|-- docs/                        # Integration, validation, and evaluation
|-- part-2-competitor-memo.md    # Mission 2 leadership memo
`-- .github/                     # CI and dependency automation
```

## Tradeoff

The fast demo prioritizes reproducibility and reviewer time:
rapid discovery plus one structured TikTok post.

Deep mode adds post and comment datasets, but takes longer because Bright
Data structured datasets are collected asynchronously.

Velocity is deliberately conservative.
Historical claims require version-compatible reports separated by at least
12 hours; otherwise the report says `unknown` or labels the result as a
current snapshot estimate.

## What I Would Ship Next

The next GTM milestone is an evidence-to-experiment pack:

1. Extract hook, pacing, visual structure, and audience language from several
   structured posts and comments.
2. Generate safe, bold, and wildcard creative variants.
3. Attach every creative decision to its supporting evidence.
4. Export variants to a vertical-video renderer or content calendar.
5. Rerun after 12 to 24 hours and compare actual trend movement.

That turns the demo from a recommendation agent into a measurable creative
production and experimentation system.

## Documentation

- [Integration guide](docs/INTEGRATION_GUIDE.md)
- [Documentation index](docs/README.md)
- [Implementation validation](docs/AGENT_2_IMPLEMENTATION_VALIDATION_2026-06-18.md)
- [Source-quality validation](docs/AGENT_2_SOURCE_QUALITY_VALIDATION.md)
- [Mission 1 concept comparison](docs/MISSION_1_IDEA_COMPARISON.md)
- [Submission evaluation](docs/SUBMISSION_EVALUATION.md)
