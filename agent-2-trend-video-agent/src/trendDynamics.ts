import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  AgentOptions,
  SaturationLabel,
  TrendCandidate,
  TrendEvidence,
  TrendVideoReport,
  VelocityLabel
} from "./types.js";

type HistoricalReport = Pick<TrendVideoReport, "analysisVersion" | "generatedAt" | "profile" | "rankedTrends">;

export async function loadTrendHistory(
  businessName: string,
  outputDir = "runs",
  maximumReports = 12
): Promise<HistoricalReport[]> {
  try {
    const entries = await readdir(outputDir, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && /^report-.*\.json$/i.test(entry.name))
      .map((entry) => path.join(outputDir, entry.name));
    const reports: HistoricalReport[] = [];

    for (const file of files) {
      try {
        const parsed = JSON.parse(await readFile(file, "utf8")) as HistoricalReport;
        if (parsed.profile?.businessName?.toLowerCase() !== businessName.toLowerCase()) continue;
        if (!Array.isArray(parsed.rankedTrends) || !parsed.generatedAt || parsed.analysisVersion !== "2.0") continue;
        if (Date.now() - Date.parse(parsed.generatedAt) < 12 * 60 * 60 * 1000) continue;
        reports.push(parsed);
      } catch {
        // Historical outputs are advisory. One malformed old file must not block a live run.
      }
    }

    return reports
      .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))
      .slice(0, maximumReports);
  } catch {
    return [];
  }
}

export function applyTrendDynamics(
  options: AgentOptions,
  evidence: TrendEvidence[],
  candidates: TrendCandidate[],
  history: HistoricalReport[]
): { candidates: TrendCandidate[]; notes: string[] } {
  let comparableHistoricalTrends = 0;
  const updated = candidates.map((candidate) => {
    const matchingEvidence = evidence.filter((source) => candidate.exampleUrls.includes(source.url));
    const historicalMatch = history
      .flatMap((report) =>
        report.rankedTrends
          .filter((trend) => trend.name.toLowerCase() === candidate.name.toLowerCase())
          .map((trend) => ({ trend, generatedAt: report.generatedAt }))
      )
      .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0];
    if (historicalMatch) comparableHistoricalTrends += 1;

    const velocity = calculateVelocity(candidate, matchingEvidence, historicalMatch);
    const saturation = calculateSaturation(candidate, matchingEvidence, Boolean(historicalMatch));
    return {
      ...candidate,
      velocityScore: velocity.score,
      velocityLabel: velocity.label,
      velocityBasis: velocity.basis,
      saturationScore: saturation.score,
      saturationLabel: saturation.label,
      saturationBasis: saturation.basis
    };
  });

  const notes = comparableHistoricalTrends
    ? [`Trend velocity used comparable records from prior reports for ${comparableHistoricalTrends} candidate(s). Same-session reruns are excluded.`]
    : [
        "No time-separated comparable trend record was available. Velocity remains unknown unless structured publication and engagement data support a snapshot estimate."
      ];

  return { candidates: updated, notes };
}

function calculateVelocity(
  candidate: TrendCandidate,
  evidence: TrendEvidence[],
  historical?: { trend: TrendCandidate; generatedAt: string }
): { score: number; label: VelocityLabel; basis: string } {
  const freshStructured = evidence.filter((source) => source.publishedAt && source.views !== undefined);
  const viewsPerDay = freshStructured
    .map((source) => (source.views ?? 0) / Math.max(1, ageInDays(source.publishedAt!)))
    .filter(Number.isFinite);
  const medianViewsPerDay = median(viewsPerDay);

  if (historical) {
    const scoreDelta = candidate.score - historical.trend.score;
    const sourceDelta =
      (candidate.independentSourceCount ?? candidate.sourceDiversity ?? 1) -
      (historical.trend.independentSourceCount ?? historical.trend.sourceDiversity ?? 1);
    const engagementBoost = medianViewsPerDay > 50_000 ? 18 : medianViewsPerDay > 10_000 ? 10 : medianViewsPerDay > 1_000 ? 5 : 0;
    const score = clamp(50 + scoreDelta * 2 + sourceDelta * 10 + engagementBoost, 0, 100);
    return {
      score,
      label: velocityLabel(score),
      basis:
        `Run-over-run comparison with ${historical.generatedAt}: score delta ${signed(scoreDelta)}, ` +
        `independent-source delta ${signed(sourceDelta)}${medianViewsPerDay ? `, median ${Math.round(medianViewsPerDay).toLocaleString()} views/day` : ""}.`
    };
  }

  if (freshStructured.length) {
    const recentCount = freshStructured.filter((source) => ageInDays(source.publishedAt!) <= 45).length;
    const score = clamp(25 + recentCount * 12 + Math.log10(Math.max(1, medianViewsPerDay)) * 8, 0, 78);
    return {
      score,
      label: score >= 60 ? "rising" : "stable",
      basis:
        `Snapshot estimate from ${freshStructured.length} structured post(s), ${recentCount} published within 45 days, ` +
        `median ${Math.round(medianViewsPerDay).toLocaleString()} views/day. Run history is not yet available.`
    };
  }

  return {
    score: 0,
    label: "unknown",
    basis: "No prior run and no structured publication-time plus engagement data; no velocity claim is made."
  };
}

function calculateSaturation(
  candidate: TrendCandidate,
  evidence: TrendEvidence[],
  hasHistory: boolean
): { score: number; label: SaturationLabel; basis: string } {
  const independentSources = candidate.independentSourceCount ?? new Set(evidence.map((source) => source.independentSourceKey ?? source.url)).size;
  const platformDiversity = candidate.platformDiversity ?? new Set(evidence.map((source) => source.platform)).size;
  const highReachPosts = evidence.filter((source) => (source.views ?? 0) >= 500_000).length;
  const discoverPages = evidence.filter((source) => /tiktok\.com\/discover\//i.test(source.url)).length;
  const score = clamp(independentSources * 10 + platformDiversity * 8 + highReachPosts * 12 + discoverPages * 6, 0, 100);

  return {
    score,
    label: saturationLabel(score),
    basis:
      `${hasHistory ? "Historical + current" : "Current snapshot proxy"}: ${independentSources} independent source(s), ` +
      `${platformDiversity} platform type(s), ${highReachPosts} post(s) above 500K views, ${discoverPages} TikTok Discover page(s).`
  };
}

function velocityLabel(score: number): VelocityLabel {
  if (score >= 75) return "accelerating";
  if (score >= 58) return "rising";
  if (score >= 40) return "stable";
  return "declining";
}

function saturationLabel(score: number): SaturationLabel {
  if (score <= 28) return "whitespace";
  if (score <= 62) return "growing";
  return "crowded";
}

function ageInDays(value: string): number {
  return Math.max(0, (Date.now() - Date.parse(value)) / 86_400_000);
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
