# Integration Guide

This guide explains how to adapt the Trend-to-Video Agent for another
business, consume its outputs, and embed it in a larger workflow.

## Integration Model

```text
business profile
  -> Bright Data MCP discovery and extraction
  -> deterministic evidence validation
  -> ranked trend opportunities
  -> creative synthesis
  -> JSON, Markdown, and HTML outputs
```

The agent is currently a private TypeScript package inside this repository.
It can be invoked through the CLI or imported by another TypeScript service.

## Environment

Create `part-1-agent/.env`:

```dotenv
BRIGHT_DATA_API_TOKEN=

# Configure at least one LLM provider.
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Optional controls.
MAX_SOURCES=10
MAX_TRENDS=5
MCP_REQUEST_TIMEOUT_MS=180000
BRIGHT_DATA_MCP_GROUPS=social
BRIGHT_DATA_SOCIAL_ENRICHMENT=true
SOCIAL_ENRICH_MAX_POSTS=1
SOCIAL_ENRICH_MAX_COMMENTS=0
```

Do not commit `.env`.
MCP and LLM errors are sanitized before they are written to telemetry.

## CLI Integration

Start from an existing sample:

```powershell
cd part-1-agent
Copy-Item .\samples\local-cafe.json .\samples\my-business.json
```

Edit the profile and run:

```powershell
npm run demo -- -- --profile-file .\samples\my-business.json `
  --max-sources 8 `
  --max-trends 5 `
  --social-posts 2 `
  --social-comments 1
```

Supported profile fields:

| Field          | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `businessName` | Display name and report-history identity            |
| `profile`      | Plain-language account or business description      |
| `niche`        | Products, services, and category vocabulary         |
| `audience`     | Intended viewers or buyers                          |
| `location`     | Local market used for queries and region inference  |
| `language`     | Search and generated-content language               |
| `goal`         | Business result the recommendation should support   |
| `capabilities` | Real production constraints and available resources |

## TypeScript Integration

The core orchestration functions are exported from the source modules:

```ts
import { persistReport, runTrendVideoAgent } from "./src/agent.js";
import { createBrightDataClient } from "./src/mcpBrightData.js";

const client = await createBrightDataClient();

try {
  const report = await runTrendVideoAgent(
    {
      profile: {
        businessName: "Example Company",
        profile: "A concise business description.",
        niche: "B2B workflow automation",
        audience: "operations leaders at mid-market companies",
        location: "New York, United States",
        language: "English",
        goal: "increase qualified demo requests",
        capabilities: [
          "founder can appear on camera",
          "can record product demonstrations",
        ],
      },
      region: "us",
      maxSources: 8,
      maxTrends: 5,
    },
    client,
  );

  const paths = await persistReport(report);
  console.log(paths);
} finally {
  await client.close();
}
```

For a separate application, either copy the package into a monorepo workspace
or publish an internal package after replacing the relative imports with a
stable package entry point.

## Output Contract

Each successful report includes:

| Property                   | Integration use                                      |
| -------------------------- | ---------------------------------------------------- |
| `profile`                  | Original normalized input                            |
| `toolsUsed`                | Successful MCP tools observed at runtime             |
| `toolTelemetry`            | Status, duration, result count, and sanitized errors |
| `rankedTrends`             | Scored opportunities and supporting URLs             |
| `recommendedConcept`       | Hook, caption, storyboard, shot list, and mode       |
| `evidenceLog`              | Source-level quality and structured social metrics   |
| `failureNotes`             | Weaknesses, partial failures, and uncertainty        |
| `futureVideoPipelineDraft` | Stable payload for a downstream renderer             |

The JSON file is the recommended machine-to-machine interface.
Markdown and HTML are presentation layers generated from the same report.

## Common Production Patterns

### Scheduled market monitoring

Run the same business profile daily or weekly and retain JSON outputs.
Reports at least 12 hours apart can support version-compatible velocity
comparisons.

### CRM or onboarding workflow

Map account fields into the profile JSON, trigger the CLI in a worker, and
attach the resulting dashboard to the customer or opportunity record.

### Content operations

Push `recommendedConcept`, `scenePlan`, and `shotList` into a content calendar
or approval queue.

### Video generation

Send `futureVideoPipelineDraft` to an internal renderer, Remotion workflow,
or another video-generation service.
Keep the evidence ledger attached so generated claims remain reviewable.

## Reliability Expectations

- A run requires at least three usable sources.
- Metadata-only sources receive less weight than complete scrapes.
- Structured TikTok data overrides misleading search snippets.
- Failed individual MCP calls are recorded and do not automatically kill the
  run.
- Insufficient total evidence stops synthesis.
- Malformed LLM output triggers deterministic synthesis.
- Historical velocity is not claimed from same-session reruns.

## Local Verification

```powershell
npm run check
```

This runs typechecking, tests, the production build, and the dependency audit.
