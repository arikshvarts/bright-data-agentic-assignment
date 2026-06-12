import type { RadarReport } from "./types.js";

export function renderMarkdownReport(report: RadarReport): string {
  const opportunities = report.rankedOpportunities
    .map(
      (opportunity) => `## ${opportunity.priority}. ${opportunity.opportunity}

**Ecosystem:** ${opportunity.ecosystem}

**Evidence strength:** ${opportunity.evidenceStrength}

**Developer pain:** ${opportunity.developerPain}

**Adoption signal:** ${opportunity.adoptionSignal}

**Implementation effort:** ${opportunity.implementationEffort}

**Rationale:** ${opportunity.rationale}

**Confidence:** ${formatPercent(opportunity.confidence)}

**Evidence:** ${opportunity.evidenceUrls.map((url) => `[source](${url})`).join(", ")}

**Contradictory signals:** ${opportunity.contradictorySignals.length ? opportunity.contradictorySignals.join("; ") : "None found in selected evidence."}
`
    )
    .join("\n");

  const evidence = report.evidenceSources
    .map(
      (source) =>
        `- ${source.scrapeStatus.toUpperCase()} | ${source.sourceType} | [${source.title}](${source.url}) | ${source.signal || "No snippet."}`
    )
    .join("\n");
  const currentCapabilities = report.currentCapabilities
    .map(
      (capability) =>
        `- **${capability.capability}** (${capability.status}): ${capability.implication}${capability.evidenceUrls.length ? ` Evidence: ${capability.evidenceUrls.map((url) => `[source](${url})`).join(", ")}` : ""}`
    )
    .join("\n");
  const competitorAnalysis = report.competitorAnalysis.length
    ? report.competitorAnalysis
        .map(
          (signal) => `- **${signal.competitor}:** ${signal.shipped} Works well: ${signal.whatWorksWell} Gap: ${signal.weaknessOrGap} Implication: ${signal.implicationForBrightData} Evidence: ${signal.evidenceUrls.map((url) => `[source](${url})`).join(", ")}`
        )
        .join("\n")
    : "- No competitor/comparable signal was strong enough in the selected evidence.";

  return `# Agent Ecosystem Opportunity Radar: ${report.company}

Generated: ${report.generatedAt}  
Region: ${report.region}  
Decision: ${report.decision}  
Tools used: ${report.toolsUsed.join(", ")}

## Decision Summary

${report.summary}

## Current ${report.company} Coverage

${currentCapabilities}

## Competitor / Comparable Signals

${competitorAnalysis}

## Recommended 90-Day Bet

**${report.recommendedBet.title}**

**Target developer:** ${report.recommendedBet.targetDeveloper}

**Problem solved:** ${report.recommendedBet.problemSolved}

**Why now:** ${report.recommendedBet.whyNow}

**Minimum viable scope:**
${report.recommendedBet.minimumViableScope.map((item) => `- ${item}`).join("\n")}

**Success metric:** ${report.recommendedBet.successMetric}

**What not to build yet:**
${report.recommendedBet.whatNotToBuildYet.map((item) => `- ${item}`).join("\n")}

**Confidence:** ${formatPercent(report.recommendedBet.confidence)}

**Evidence:** ${report.recommendedBet.evidenceUrls.map((url) => `[source](${url})`).join(", ")}

## Ranked Integration Opportunities

${opportunities}
## Evidence Log

${evidence}

## Tradeoff

${report.tradeoff}

## Next Steps

${report.nextSteps.map((step) => `- ${step}`).join("\n")}
`;
}

export function renderConsoleSummary(report: RadarReport): string {
  const topOpportunities = report.rankedOpportunities
    .slice(0, 3)
    .map((opportunity) => `${opportunity.priority}. ${opportunity.opportunity} (${opportunity.ecosystem})`)
    .join("\n");

  return `Agent Ecosystem Opportunity Radar complete for "${report.company}"

Decision: ${report.decision}

Tools used: ${report.toolsUsed.join(", ")}
Evidence sources: ${report.evidenceSources.length}

${report.summary}

Recommended 90-day bet:
${report.recommendedBet.title}

Top integration opportunities:
${topOpportunities}
`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
