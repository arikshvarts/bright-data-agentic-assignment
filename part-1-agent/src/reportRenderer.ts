import type { TrendVideoReport } from "./types.js";

export function renderMarkdownReport(report: TrendVideoReport): string {
  const trends = report.rankedTrends
    .map(
      (trend, index) => `## ${index + 1}. ${trend.name}

**Platform:** ${trend.platform}

**Format:** ${trend.format}

**Topic:** ${trend.topic}

**Evidence strength:** ${trend.evidenceStrength}

**Niche fit:** ${trend.nicheFit}

**Location fit:** ${trend.locationFit}

**Production fit:** ${trend.productionFit}

**Brand safety:** ${trend.brandSafety}

**Trend stage:** ${trend.trendStage ?? "unclear"}

**Validation level:** ${trend.validationLevel ?? "weak"}

**Independent source diversity:** ${trend.sourceDiversity ?? 1}

**Platform diversity:** ${trend.platformDiversity ?? 1}

**Independent sources:** ${trend.independentSourceCount ?? trend.sourceDiversity ?? 1}

**Velocity:** ${trend.velocityLabel ?? "unknown"} (${Math.round(trend.velocityScore ?? 0)}/100)

**Velocity basis:** ${trend.velocityBasis ?? "Not calculated."}

**Saturation:** ${trend.saturationLabel ?? "unknown"} (${Math.round(trend.saturationScore ?? 0)}/100)

**Saturation basis:** ${trend.saturationBasis ?? "Not calculated."}

**Why it fits:** ${trend.fitRationale}

**Risks / conflicts:** ${trend.risks.length ? trend.risks.join("; ") : "None found in selected evidence."}

**Confidence:** ${formatPercent(trend.confidence)}

**Examples:** ${trend.exampleUrls.length ? trend.exampleUrls.map((url) => `[source](${url})`).join(", ") : "No direct example URL retained."}
`,
    )
    .join("\n");

  const evidence = report.evidenceLog
    .map(
      (source) =>
        `- ${source.scrapeStatus.toUpperCase()} | ${source.platform} | ${source.structuredDataStatus === "ok" ? "structured" : source.sourceType} | [${source.title}](${source.url}) | ${source.snippet || "No snippet."}${source.views !== undefined ? ` | ${source.views.toLocaleString()} views` : ""}${source.likes !== undefined ? ` | ${source.likes.toLocaleString()} likes` : ""}${source.error ? ` | ${source.error}` : ""}`,
    )
    .join("\n");
  const telemetry = report.toolTelemetry
    .map(
      (entry) =>
        `- ${entry.status.toUpperCase()} | \`${entry.name}\` | ${entry.durationMs}ms | ${entry.resultCount} result(s)${entry.error ? ` | ${entry.error}` : ""}`,
    )
    .join("\n");

  return `# Trend-to-Video Agent: ${report.profile.businessName}

Generated: ${report.generatedAt}
Location: ${report.profile.location}
Language: ${report.profile.language}
Goal: ${report.profile.goal}
Tools used: ${report.toolsUsed.join(", ")}

## Profile

${report.profile.profile}

**Niche:** ${report.profile.niche}
**Audience:** ${report.profile.audience}
**Capabilities:** ${report.profile.capabilities.join("; ")}

## Decision Summary

${report.summary}

## Recommended Content Opportunity

**${report.recommendedConcept.title}**

**Trend:** ${report.recommendedConcept.trendName}

**Hook:** ${report.recommendedConcept.hook}

**Format:** ${report.recommendedConcept.format}

**Caption:** ${report.recommendedConcept.caption}

**Execution style:** ${report.recommendedConcept.executionStyle}

**Production mode:** ${report.recommendedConcept.productionMode}

**Scene plan:**
${report.recommendedConcept.scenePlan.map((scene) => `- ${scene}`).join("\n")}

**Shot list:**
${report.recommendedConcept.shotList.map((shot) => `- ${shot}`).join("\n")}

${report.recommendedConcept.aiVideoPrompt ? `**AI-video prompt:** ${report.recommendedConcept.aiVideoPrompt}\n` : ""}
**Confidence:** ${formatPercent(report.recommendedConcept.confidence)}

## Ranked Trends

${trends}
## Evidence Log

${evidence}

## MCP Execution Trace

${telemetry || "- No MCP calls were recorded."}

## Failure / Uncertainty Notes

${report.failureNotes.length ? report.failureNotes.map((note) => `- ${note}`).join("\n") : "- No major failure notes."}

## Future Video Pipeline Draft

This is compatible with a future MoneyPrinterTurbo-style pipeline, but no video is rendered in this MVP.

\`\`\`json
${JSON.stringify(report.futureVideoPipelineDraft, null, 2)}
\`\`\`

## Tradeoff

${report.tradeoff}

## Next Steps

${report.nextSteps.map((step) => `- ${step}`).join("\n")}
`;
}

export function renderConsoleSummary(report: TrendVideoReport): string {
  const topTrends = report.rankedTrends
    .slice(0, 3)
    .map((trend, index) => `${index + 1}. ${trend.name} (${trend.format})`)
    .join("\n");

  return `Trend-to-Video Agent complete for "${report.profile.businessName}"

Goal: ${report.profile.goal}
Location: ${report.profile.location}
Tools used: ${report.toolsUsed.join(", ")}
Evidence sources: ${report.evidenceLog.length}

${report.summary}

Recommended concept:
${report.recommendedConcept.title}

Top trends:
${topTrends}
`;
}

export function renderHtmlDashboard(report: TrendVideoReport): string {
  const successfulCalls = report.toolTelemetry.filter(
    (entry) => entry.status === "ok",
  ).length;
  const structuredSources = report.evidenceLog.filter(
    (source) => source.structuredDataStatus === "ok",
  ).length;
  const topTrend = report.rankedTrends[0];
  const trendCards = report.rankedTrends
    .map(
      (trend, index) => `
        <article class="trend-card">
          <div class="rank">${index + 1}</div>
          <div class="trend-head">
            <div>
              <p class="eyebrow">${escapeHtml(trend.platform)} · ${escapeHtml(trend.validationLevel ?? "weak")}</p>
              <h3>${escapeHtml(trend.name)}</h3>
            </div>
            <span class="confidence">${formatPercent(trend.confidence)}</span>
          </div>
          <p>${escapeHtml(trend.fitRationale)}</p>
          <div class="metric-grid">
            ${metricBar("Velocity", trend.velocityScore ?? 0, trend.velocityLabel ?? "unknown", "teal")}
            ${metricBar("Saturation", trend.saturationScore ?? 0, trend.saturationLabel ?? "unknown", "coral")}
          </div>
          <dl class="facts">
            <div><dt>Independent sources</dt><dd>${trend.independentSourceCount ?? trend.sourceDiversity ?? 1}</dd></div>
            <div><dt>Platforms</dt><dd>${trend.platformDiversity ?? 1}</dd></div>
            <div><dt>Production</dt><dd>${escapeHtml(trend.productionFit)}</dd></div>
            <div><dt>Stage</dt><dd>${escapeHtml(trend.trendStage ?? "unclear")}</dd></div>
          </dl>
          <p class="basis"><strong>Velocity:</strong> ${escapeHtml(trend.velocityBasis ?? "Not calculated.")}</p>
          <p class="basis"><strong>Saturation:</strong> ${escapeHtml(trend.saturationBasis ?? "Not calculated.")}</p>
          <div class="links">${trend.exampleUrls.map((url) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">Open evidence</a>`).join("")}</div>
        </article>`,
    )
    .join("");

  const evidenceRows = report.evidenceLog
    .map(
      (source) => `
        <tr>
          <td><span class="status status-${escapeAttribute(source.scrapeStatus)}">${escapeHtml(source.scrapeStatus)}</span></td>
          <td><span class="platform">${escapeHtml(source.platform)}</span></td>
          <td>
            <a class="source-title" href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a>
            <small>${escapeHtml(source.author ?? source.independentSourceKey ?? "Unknown source")}</small>
          </td>
          <td>${formatCompactNumber(source.views)}</td>
          <td>${formatCompactNumber(source.likes)}</td>
          <td>${source.publishedAt ? escapeHtml(source.publishedAt.slice(0, 10)) : "n/a"}</td>
          <td>${source.structuredDataStatus === "ok" ? "structured" : escapeHtml(source.sourceType)}</td>
        </tr>`,
    )
    .join("");

  const telemetryRows = report.toolTelemetry
    .map(
      (entry) => `
        <tr>
          <td><code>${escapeHtml(entry.name)}</code></td>
          <td><span class="status status-${entry.status === "ok" ? "ok" : "failed"}">${entry.status}</span></td>
          <td>${entry.durationMs.toLocaleString()} ms</td>
          <td>${entry.resultCount}</td>
          <td>${escapeHtml(entry.error ?? "")}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${escapeAttribute(report.futureVideoPipelineDraft.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(report.profile.businessName)} Trend Evidence Dashboard</title>
  <style>
    :root { --ink:#17202a; --muted:#5f6b76; --line:#d9e0e5; --paper:#f7f9fa; --white:#fff; --teal:#087f8c; --coral:#d95d39; --yellow:#f2c14e; --green:#27864f; --red:#b42318; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--paper); font-family:Inter,Segoe UI,Arial,sans-serif; letter-spacing:0; }
    a { color:var(--teal); }
    header { background:var(--ink); color:var(--white); padding:32px max(24px,calc((100vw - 1180px)/2)); border-bottom:6px solid var(--yellow); }
    header p { color:#d9e0e5; max-width:850px; margin:10px 0 0; line-height:1.5; }
    h1 { margin:0; font-size:clamp(28px,4vw,48px); line-height:1.05; }
    h2 { font-size:24px; margin:0 0 16px; }
    h3 { margin:4px 0 8px; font-size:18px; }
    main { width:min(1180px,calc(100% - 32px)); margin:24px auto 48px; }
    section { margin-top:30px; }
    .kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .kpi,.concept,.trend-card,.table-wrap,.storyboard { background:var(--white); border:1px solid var(--line); border-radius:6px; }
    .kpi { padding:18px; border-top:4px solid var(--teal); }
    .kpi:nth-child(2) { border-top-color:var(--coral); }
    .kpi:nth-child(3) { border-top-color:var(--yellow); }
    .kpi:nth-child(4) { border-top-color:var(--green); }
    .kpi strong { display:block; font-size:28px; margin-top:6px; }
    .label,.eyebrow { color:var(--muted); font-size:12px; text-transform:uppercase; font-weight:700; }
    .concept { display:grid; grid-template-columns:1.2fr .8fr; gap:24px; padding:24px; border-left:6px solid var(--coral); }
    .hook { font-size:22px; font-weight:750; line-height:1.3; }
    .concept-meta { display:grid; gap:10px; align-content:start; }
    .concept-meta div { border-bottom:1px solid var(--line); padding-bottom:10px; }
    .concept-meta .label { display:block; margin-bottom:4px; }
    .concept-meta strong { display:block; line-height:1.35; }
    .trend-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .trend-card { position:relative; padding:20px; overflow:hidden; }
    .rank { position:absolute; right:14px; top:8px; color:#d9e0e5; font-size:52px; font-weight:800; }
    .trend-head { display:flex; justify-content:space-between; gap:16px; position:relative; }
    .confidence { font-weight:800; color:var(--teal); padding-right:42px; }
    .metric-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:18px 0; }
    .metric-row { display:grid; grid-template-columns:1fr auto; gap:6px; font-size:13px; }
    .bar { grid-column:1/-1; height:8px; background:#e8edf0; }
    .bar span { display:block; height:100%; }
    .bar .teal { background:var(--teal); } .bar .coral { background:var(--coral); }
    .facts { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .facts div { background:var(--paper); padding:9px; }
    dt { color:var(--muted); font-size:11px; } dd { margin:4px 0 0; font-weight:700; }
    .basis { font-size:12px; color:var(--muted); line-height:1.45; }
    .links { display:flex; flex-wrap:wrap; gap:8px; }
    .links a { font-size:12px; font-weight:700; }
    .storyboard { display:grid; grid-template-columns:repeat(${Math.min(5, report.recommendedConcept.scenePlan.length)},1fr); overflow:hidden; }
    .scene { min-height:150px; padding:16px; border-right:1px solid var(--line); }
    .scene:last-child { border-right:0; }
    .scene strong { display:block; color:var(--coral); margin-bottom:10px; }
    .table-wrap { overflow:auto; }
    table { width:100%; border-collapse:collapse; min-width:820px; }
    th,td { padding:12px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; font-size:13px; }
    th { background:#eef2f4; color:var(--muted); font-size:11px; text-transform:uppercase; position:sticky; top:0; }
    .source-title { display:block; font-weight:700; max-width:420px; }
    small { display:block; color:var(--muted); margin-top:4px; }
    .status { display:inline-block; padding:3px 7px; border-radius:3px; font-size:11px; font-weight:800; text-transform:uppercase; background:#e8edf0; }
    .status-ok { color:var(--green); background:#e8f5ed; }
    .status-failed { color:var(--red); background:#fdecea; }
    .status-partial,.status-metadata_only { color:#805b00; background:#fff4ce; }
    code { font-family:Consolas,monospace; }
    .notes { columns:2; padding-left:20px; }
    .notes li { margin-bottom:8px; break-inside:avoid; }
    @media (max-width:850px) {
      .kpis,.trend-grid { grid-template-columns:1fr 1fr; }
      .concept { grid-template-columns:1fr; }
      .storyboard { grid-template-columns:1fr; }
      .scene { border-right:0; border-bottom:1px solid var(--line); min-height:0; }
    }
    @media (max-width:540px) {
      .kpis,.trend-grid,.metric-grid,.facts { grid-template-columns:1fr; }
      .notes { columns:1; }
    }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">Bright Data MCP · Trend-to-Video Agent</p>
    <h1>${escapeHtml(report.profile.businessName)}</h1>
    <p>${escapeDisplayText(report.summary)}</p>
  </header>
  <main>
    <section class="kpis">
      ${kpi("Evidence sources", String(report.evidenceLog.length))}
      ${kpi("Structured social", String(structuredSources))}
      ${kpi("Successful MCP calls", String(successfulCalls))}
      ${kpi("Top confidence", topTrend ? formatPercent(topTrend.confidence) : "n/a")}
    </section>
    <section>
      <h2>Recommended Opportunity</h2>
      <article class="concept">
        <div>
          <p class="eyebrow">${escapeHtml(report.recommendedConcept.productionMode)}</p>
          <h3>${escapeHtml(report.recommendedConcept.title)}</h3>
          <p class="hook">${escapeHtml(report.recommendedConcept.hook)}</p>
          <p>${escapeHtml(report.recommendedConcept.executionStyle)}</p>
        </div>
        <div class="concept-meta">
          <div><span class="label">Format</span><strong>${escapeHtml(report.recommendedConcept.format)}</strong></div>
          <div><span class="label">Caption</span><strong>${escapeHtml(report.recommendedConcept.caption)}</strong></div>
          <div><span class="label">Goal</span><strong>${escapeHtml(report.profile.goal)}</strong></div>
          <div><span class="label">Location</span><strong>${escapeHtml(report.profile.location)}</strong></div>
        </div>
      </article>
    </section>
    <section>
      <h2>Storyboard</h2>
      <div class="storyboard">${report.recommendedConcept.scenePlan
        .map(
          (scene, index) =>
            `<div class="scene"><strong>Scene ${index + 1}</strong>${escapeHtml(scene)}</div>`,
        )
        .join("")}</div>
    </section>
    <section>
      <h2>Ranked Trend Opportunities</h2>
      <div class="trend-grid">${trendCards}</div>
    </section>
    <section>
      <h2>Evidence Ledger</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Status</th><th>Platform</th><th>Source</th><th>Views</th><th>Likes</th><th>Published</th><th>Evidence type</th></tr></thead>
        <tbody>${evidenceRows}</tbody>
      </table></div>
    </section>
    <section>
      <h2>MCP Execution Trace</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Tool</th><th>Status</th><th>Duration</th><th>Results</th><th>Error</th></tr></thead>
        <tbody>${telemetryRows}</tbody>
      </table></div>
    </section>
    <section>
      <h2>Failure and Uncertainty Notes</h2>
      <ul class="notes">${report.failureNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
    </section>
  </main>
</body>
</html>`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function metricBar(
  label: string,
  value: number,
  status: string,
  color: "teal" | "coral",
): string {
  const width = Math.max(0, Math.min(100, Math.round(value)));
  return `<div class="metric-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(status)} · ${width}</span><div class="bar"><span class="${color}" style="width:${width}%"></span></div></div>`;
}

function kpi(label: string, value: string): string {
  return `<article class="kpi"><span class="label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function formatCompactNumber(value?: number): string {
  if (value === undefined) return "n/a";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeDisplayText(value: string): string {
  return escapeHtml(
    value
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1"),
  );
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
