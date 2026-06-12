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

**Source diversity:** ${trend.sourceDiversity ?? 1} platform/source type(s)

**Why it fits:** ${trend.fitRationale}

**Risks / conflicts:** ${trend.risks.length ? trend.risks.join("; ") : "None found in selected evidence."}

**Confidence:** ${formatPercent(trend.confidence)}

**Examples:** ${trend.exampleUrls.length ? trend.exampleUrls.map((url) => `[source](${url})`).join(", ") : "No direct example URL retained."}
`
    )
    .join("\n");

  const evidence = report.evidenceLog
    .map(
      (source) =>
        `- ${source.scrapeStatus.toUpperCase()} | ${source.platform} | ${source.sourceType} | [${source.title}](${source.url}) | ${source.snippet || "No snippet."}${source.error ? ` | ${source.error}` : ""}`
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

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
