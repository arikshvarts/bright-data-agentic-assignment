import type { AgentOptions, TrendEvidence } from "./types.js";

const genericTerms = new Set([
  "business",
  "creator",
  "content",
  "video",
  "social",
  "young",
  "people",
  "place",
  "spot",
  "work",
  "goal",
  "increase",
  "audience"
]);

export function revalidateEvidence(options: AgentOptions, sources: TrendEvidence[]): TrendEvidence[] {
  return sources
    .map((source) => scoreEvidence(options, source))
    .filter((source) => source.relevanceTier !== "weak")
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}

export function scoreEvidence(options: AgentOptions, source: TrendEvidence): TrendEvidence {
  const nicheTerms = relevantTerms(`${options.profile.niche} ${options.profile.profile}`);
  const location = options.profile.location.split(",")[0].trim().toLowerCase();
  const authoritativeText =
    source.structuredDataStatus === "ok"
      ? `${source.title} ${source.content ?? ""}`
      : `${source.url} ${source.title} ${source.snippet} ${source.content ?? ""}`;
  const text = authoritativeText.toLowerCase();
  const nicheMatches = nicheTerms.filter((term) => text.includes(term));
  const locationMatch = location.length > 2 && text.includes(location);
  const directScore = nicheMatches.length * 2 + (locationMatch ? 4 : 0);
  const isSupportingSurface = ["creative_center", "trend_intel", "article", "reddit", "youtube"].includes(source.platform);
  const hasTrendSignal = /trend|format|hook|short-form|tiktok|viral|creator|sound|hashtag/i.test(text);
  const tier = directScore >= 2 ? "direct" : isSupportingSurface && hasTrendSignal ? "supporting" : "weak";

  return {
    ...source,
    relevanceTier: tier,
    relevanceScore: directScore + (isSupportingSurface && hasTrendSignal ? 1 : 0),
    qualityNotes: [
      ...(source.qualityNotes ?? []),
      `relevance ${tier}: ${nicheMatches.length} niche term(s)${locationMatch ? ", location match" : ""}`
    ]
  };
}

function relevantTerms(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 4 && !genericTerms.has(term))
    )
  ];
}
