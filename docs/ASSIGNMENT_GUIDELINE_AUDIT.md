# Assignment Guideline Audit

Updated: June 18, 2026

## Executive Summary

The recommended Mission 1 submission is `part-1-agent/`.

It is a production-oriented CLI web agent that turns a business profile plus current web/social evidence into:

- Ranked trend opportunities.
- Traceable evidence links.
- Structured TikTok metrics when available.
- A production-ready concept and storyboard.
- Markdown, JSON, and HTML dashboard outputs.
- A future MoneyPrinterTurbo-compatible payload.

## Requirement Coverage

| Requirement | Current implementation | Practical verification |
| --- | --- | --- |
| Production-quality web agent | Typed TypeScript CLI, Zod profile validation, MCP orchestration, evidence normalization, relevance validation, structured enrichment, deterministic scoring, LLM synthesis, fallback, reports, dashboard, tests. | Typecheck/build/live runs passed |
| Bright Data MCP core infrastructure | Spawns `npx -y @brightdata/mcp` over MCP stdio with the `social` group. | Verified live |
| At least two distinct Bright Data tools | Fast mode uses `search_engine`, `discover`, `scrape_as_markdown`, and `web_data_tiktok_posts`. Deep mode adds `web_data_tiktok_comments`. | All five succeeded in live validation |
| One-command end-to-end | `npm run demo:live` after install and env setup. | Passed live |
| Real failure handling | Handles MCP `isError`, invalid geo fields, thin social scrape, misleading snippets, weak evidence, malformed LLM JSON, old-model history, region contamination, and CLI forwarding behavior. | Each was encountered during development |
| Evidence and links | Evidence ledger includes URLs, platform, source status, relevance, structured metrics, and uncertainty. | Committed sample |
| Clear output | Console, Markdown, JSON, responsive HTML dashboard. | Generated live |
| Location awareness | Search receives `geo_location`; Discover receives country/language; region is inferred from profile. | Israel and US profiles verified |
| Social uncertainty | Metadata-only evidence has reduced weight and explicit status. | Weak one-source run correctly exited |
| Creative deliverable | One concept with hook, caption, production mode, scenes, shots, and optional AI prompt. | All three profiles produced concepts |
| Extensible video pipeline | `futureVideoPipelineDraft` contains subject, script, scenes, assets, caption, music mood, and 9:16 mode. | JSON sample |
| Competitor memo | Firecrawl memo and supporting writeup remain in the root. | Present |

## Commands Verified

```powershell
cd part-1-agent
npm run typecheck
npm test
npm run build
npm audit
npm run demo:live
npm run demo:fitness
npm run demo:b2b
```

Deep structured social validation was also run with two TikTok posts and one comments dataset, equivalent to:

```powershell
npm run demo:deep-social
```

Final automated status:

- 12 test files passed.
- 19 tests passed.
- Typecheck passed.
- Build passed.
- Audit passed with zero vulnerabilities.
- `git diff --check` passed.

## Real Failure Modes

| Failure | Actual behavior | Implemented response |
| --- | --- | --- |
| MCP error returned as `isError` | Failed Discover calls appeared successful. | Wrapper now throws MCP error results; telemetry is truthful. |
| Invalid Discover city | `city: Tel Aviv` returned HTTP 400. | City stays in query; official country/language fields remain. |
| Thin TikTok page scrape | Public page returned little Markdown. | Retain as lower-weight `metadata_only`. |
| Misleading search snippet | Unrelated video looked relevant in SERP text. | Revalidate after structured caption extraction and reject weak evidence. |
| Insufficient evidence | One source remained with score `0.35`. | Exit with remediation instead of generating a report. |
| Malformed Anthropic JSON | Multiple live responses were invalid. | Deterministic profile-specific report completed. |
| False velocity from keywords | `2026/latest/rising` was treated as momentum. | Removed; velocity needs history or structured date plus engagement. |
| False velocity across scoring versions | Old and new scores appeared to accelerate. | Added `analysisVersion: 2.0` and 12-hour separation. |
| Wrong region from `.env` | New York profile queried Israel. | Infer region from profile unless `--region` is explicit. |
| npm custom argument forwarding | Named flags were stripped with one separator. | Tested command uses `npm run demo -- -- --profile-file ...`. |
| New dependency advisory | `form-data` high advisory appeared. | `npm audit fix`; final audit clean. |

## Live Profile Results

### Nook & Pour

- Israel targeting.
- Six evidence sources.
- Structured TikTok post with 64K views.
- Local Reddit study evidence.
- Four trends.
- Dashboard generated.

### Maya Moves

- US targeting.
- Six fitness sources.
- Structured beginner-fitness post.
- Four generalized trends.
- No cafe-shaped copy.

### LedgerPilot

- US targeting.
- Six finance/bookkeeping sources.
- Structured freelancer-invoicing TikTok.
- Four trends, correcting the previous two-trend weakness.
- No cafe-shaped copy.

## Submission Artifacts

```text
part-1-agent/runs/sample-report.md
part-1-agent/runs/sample-report.json
part-1-agent/runs/sample-dashboard.html
docs/AGENT_2_IMPLEMENTATION_VALIDATION_2026-06-18.md
docs/PART_1_AGENT_2_WRITEUP.md
part-2-competitor-memo.md
```

## GitHub Status

Remote:

```text
https://github.com/arikshvarts/bright-data-agentic-assignment.git
```

The implementation is committed and pushed to `main`. GitHub Actions validates both runnable agent packages on pushes and pull requests.

## Honest Remaining Limits

- Deep TikTok dataset collection is slower than Rapid tools.
- True velocity improves after scheduled repeated runs accumulate.
- Snapshot saturation is a proxy, clearly labeled as such.
- The current dashboard is a generated static report, not a persistent hosted application.
- Video rendering remains intentionally outside MVP scope.
