import type { AgentOptions, Platform, ProductionMode, TrendCandidate, TrendEvidence, TrendStage, ValidationLevel } from "./types.js";

type TopicPattern = {
  name: string;
  format: string;
  topic: string;
  patterns: RegExp[];
  productionMode: ProductionMode;
  risk?: string;
};

const topicPatterns: TopicPattern[] = [
  {
    name: "POV routine or day-in-the-life",
    format: "POV micro-vlog",
    topic: "show how the offer fits into a recognizable audience routine",
    patterns: [/pov|routine|day in my life|vlog|study|work|remote|morning|evening|with me/i],
    productionMode: "human_shot"
  },
  {
    name: "Behind-the-scenes process",
    format: "process reveal or ASMR",
    topic: "make the work, craft, workflow, or transformation visible",
    patterns: [/asmr|behind the scenes|process|workflow|making|build|how it works|satisfying|preparation|demo/i],
    productionMode: "human_shot"
  },
  {
    name: "Local discovery or hidden gem",
    format: "neighborhood discovery",
    topic: "position the business, creator, or experience as locally relevant and worth discovering",
    patterns: [/hidden gem|local|neighborhood|where to go|places|near me|city guide|community/i],
    productionMode: "human_shot"
  },
  {
    name: "Before-and-after transformation",
    format: "contrast reveal",
    topic: "show a clear change in state, result, workflow, or customer outcome",
    patterns: [/before and after|before\/after|transformation|from .* to|result|upgrade|makeover|then vs now|chaos|calm/i],
    productionMode: "hybrid",
    risk: "The transformation must be supportable and should not exaggerate the product or service outcome."
  },
  {
    name: "Myth-versus-fact explainer",
    format: "expert reaction or correction",
    topic: "turn a common misconception into a fast, useful explanation",
    patterns: [/myth|mistake|wrong|truth|fact|expert|explainer|nobody tells you|stop doing|did you know/i],
    productionMode: "human_shot"
  },
  {
    name: "Comment-reply or audience reaction",
    format: "reply-to-comment video",
    topic: "use a real audience question or objection as the opening hook",
    patterns: [/comment|question|asked|reply|reaction|people say|customer|review|community/i],
    productionMode: "human_shot"
  },
  {
    name: "Low-stakes native humor",
    format: "brand-safe meme or relatable sketch",
    topic: "translate an audience frustration into platform-native humor",
    patterns: [/brain rot|brainrot|unserious|meme|humor|funny|relatable|aura|expectation vs reality/i],
    productionMode: "hybrid",
    risk: "Humor must match the brand voice and should not obscure the practical value."
  },
  {
    name: "Mini guide / listicle",
    format: "3 tips / reasons / examples",
    topic: "compress practical niche knowledge into a saveable sequence",
    patterns: [/guide|tips|best|top|three|3|list|things to do|where|ways|reasons|steps/i],
    productionMode: "human_shot"
  },
  {
    name: "Challenge or constrained experiment",
    format: "test, challenge, or timed experiment",
    topic: "create curiosity by testing a claim or completing a useful constraint",
    patterns: [/challenge|test|experiment|trying|for 7 days|in 30 seconds|under \$|can we|versus|vs\./i],
    productionMode: "human_shot"
  }
];

export type TrendAnalysis = {
  candidates: TrendCandidate[];
  failureNotes: string[];
};

export function analyzeTrends(options: AgentOptions, evidence: TrendEvidence[]): TrendAnalysis {
  const candidates = topicPatterns
    .map((pattern) => buildCandidate(options, evidence, pattern))
    .filter((candidate) => candidate.exampleUrls.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.maxTrends);

  const selected = backfillCandidates(candidates, options, evidence);
  return {
    candidates: selected,
    failureNotes: buildFailureNotes(options, evidence, selected)
  };
}

function buildCandidate(options: AgentOptions, evidence: TrendEvidence[], pattern: TopicPattern): TrendCandidate {
  const matching = evidence.filter((source) => pattern.patterns.some((candidatePattern) => candidatePattern.test(evidenceText(source))));
  const evidenceScore = matching.reduce((sum, source) => sum + evidenceQuality(source), 0);
  const nicheFit = matching.some((source) => containsAny(evidenceText(source), options.profile.niche.split(/[, ]+/))) ? "high" : "medium";
  const locationFit = matching.some((source) => evidenceText(source).toLowerCase().includes(options.profile.location.toLowerCase().split(",")[0])) ? "high" : "medium";
  const productionFit = pattern.productionMode === "human_shot" && hasHumanShotCapability(options) ? "high" : pattern.productionMode === "hybrid" ? "medium" : "low";
  const brandSafety = pattern.risk ? "medium" : "high";
  const socialBoost = matching.filter((source) => ["tiktok", "youtube", "creative_center"].includes(source.platform)).length * 2;
  const score = evidenceScore + socialBoost + fitValue(nicheFit) + fitValue(locationFit) + fitValue(productionFit) + fitValue(brandSafety);
  const validationLevel = inferValidationLevel(matching);
  const trendStage = inferTrendStage(matching);
  const independentSourceCount = new Set(matching.map((source) => source.independentSourceKey ?? source.url)).size;
  const platformDiversity = new Set(matching.map((source) => source.platform)).size;

  return {
    name: pattern.name,
    platform: dominantPlatform(matching),
    format: pattern.format,
    topic: pattern.topic,
    score,
    evidenceStrength: score >= 22 ? "high" : score >= 12 ? "medium" : "low",
    nicheFit,
    locationFit,
    productionFit,
    brandSafety,
    trendStage,
    validationLevel,
    sourceDiversity: independentSourceCount,
    platformDiversity,
    independentSourceCount,
    fitRationale: `${pattern.name} fits ${options.profile.businessName} because it maps the trend format to ${options.profile.niche}, ${options.profile.audience}, and the goal to ${options.profile.goal}.`,
    risks: pattern.risk ? [pattern.risk] : [],
    exampleUrls: [...new Set(matching.map((source) => source.url))].slice(0, 4),
    confidence: Math.max(0.52, Math.min(0.9, 0.48 + score / 50))
  };
}

function fallbackCandidates(options: AgentOptions, evidence: TrendEvidence[]): TrendCandidate[] {
  const fallbackFormats = [
    { name: "Evidence-led POV adaptation", format: "POV micro-vlog" },
    { name: "Evidence-led process reveal", format: "behind-the-scenes demonstration" },
    { name: "Evidence-led mini explainer", format: "three-part educational short" },
    { name: "Evidence-led audience response", format: "comment-reply video" },
    { name: "Evidence-led transformation", format: "before-and-after contrast" }
  ];
  return evidence.slice(0, Math.max(3, options.maxTrends)).map((source, index) => ({
    name: fallbackFormats[index % fallbackFormats.length].name,
    platform: source.platform === "unknown" ? "cross_platform" : source.platform,
    format: fallbackFormats[index % fallbackFormats.length].format,
    topic: source.snippet || source.title,
    score: evidenceQuality(source) + 8 - index,
    evidenceStrength: source.scrapeStatus === "ok" ? "medium" : "low",
    nicheFit: "medium",
    locationFit: evidenceText(source).toLowerCase().includes(options.profile.location.toLowerCase().split(",")[0]) ? "high" : "low",
    productionFit: "high",
    brandSafety: "medium",
    trendStage: source.recencyHint ? "rising" : "unclear",
    validationLevel: source.url.includes("/video/") || source.url.includes("youtube.com/shorts") ? "direct_video" : source.platform === "tiktok" ? "platform_discovery" : "supporting_signal",
    sourceDiversity: 1,
    platformDiversity: 1,
    independentSourceCount: 1,
    fitRationale: `Selected as a fallback because the source survived discovery and can be adapted to ${options.profile.niche}.`,
    risks: ["Trend label is inferred from limited evidence; manually review before posting."],
    exampleUrls: [source.url],
    confidence: 0.58
  }));
}

function backfillCandidates(candidates: TrendCandidate[], options: AgentOptions, evidence: TrendEvidence[]): TrendCandidate[] {
  const target = Math.min(options.maxTrends, Math.max(3, candidates.length));
  const result = [...candidates];
  const seen = new Set(result.map((candidate) => candidate.name.toLowerCase()));

  for (const fallback of fallbackCandidates(options, evidence)) {
    if (result.length >= target) break;
    if (seen.has(fallback.name.toLowerCase())) continue;
    result.push(fallback);
    seen.add(fallback.name.toLowerCase());
  }

  return result.slice(0, options.maxTrends);
}

function buildFailureNotes(options: AgentOptions, evidence: TrendEvidence[], candidates: TrendCandidate[]): string[] {
  const notes: string[] = [];
  const failed = evidence.filter((source) => source.scrapeStatus === "failed").length;
  const metadataOnly = evidence.filter((source) => source.scrapeStatus === "metadata_only").length;
  const locationMatch = evidence.some((source) => evidenceText(source).toLowerCase().includes(options.profile.location.toLowerCase().split(",")[0]));

  if (failed) notes.push(`${failed} source(s) failed to scrape and were kept in the evidence log with sanitized errors.`);
  if (metadataOnly) notes.push(`${metadataOnly} social source(s) were retained as metadata-only because the public page had limited scrapeable text.`);
  if (!locationMatch) notes.push(`Regional evidence for ${options.profile.location} was weak, so the agent widened to language/niche/platform signals and lowered confidence.`);
  if (candidates.some((candidate) => candidate.risks.length)) notes.push("At least one candidate has brand-safety or authenticity caveats that should be reviewed before posting.");

  return notes;
}

function evidenceQuality(source: TrendEvidence): number {
  const scrapeScore = source.scrapeStatus === "ok" ? 5 : source.scrapeStatus === "partial" ? 3 : source.scrapeStatus === "metadata_only" ? 2 : 0;
  const platformScore = ["tiktok", "youtube", "creative_center"].includes(source.platform)
    ? 4
    : ["trend_intel", "reddit", "article"].includes(source.platform)
      ? 2
      : 1;
  const recencyScore = source.recencyHint ? 2 : 0;
  const engagementScore = source.engagementHint ? 2 : 0;
  return scrapeScore + platformScore + recencyScore + engagementScore;
}

function inferValidationLevel(sources: TrendEvidence[]): ValidationLevel {
  if (sources.some((source) => /\/video\/|youtube\.com\/shorts/i.test(source.url))) return "direct_video";
  if (sources.some((source) => source.platform === "tiktok" && /\/discover\//i.test(source.url))) return "platform_discovery";
  if (sources.some((source) => ["trend_intel", "reddit", "article", "youtube"].includes(source.platform))) return "supporting_signal";
  return "weak";
}

function inferTrendStage(sources: TrendEvidence[]): TrendStage {
  const dated = sources.filter((source) => source.publishedAt).map((source) => ageInDays(source.publishedAt!));
  if (dated.some((days) => days <= 14)) return "emerging";
  if (dated.some((days) => days <= 60)) return "rising";
  if (sources.some((source) => source.structuredDataStatus === "ok" && (source.views ?? 0) > 0)) return "evergreen";
  return "unclear";
}

function evidenceText(source: TrendEvidence): string {
  return `${source.title} ${source.snippet} ${source.content ?? ""}`;
}

function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.filter((term) => term.length > 3).some((term) => lower.includes(term.toLowerCase()));
}

function fitValue(value: "low" | "medium" | "high"): number {
  return value === "high" ? 4 : value === "medium" ? 2 : 0;
}

function dominantPlatform(sources: TrendEvidence[]): Platform | "cross_platform" {
  if (!sources.length) return "cross_platform";
  const counts = new Map<Platform, number>();
  for (const source of sources) counts.set(source.platform, (counts.get(source.platform) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.length > 1 ? "cross_platform" : sorted[0][0];
}

function hasHumanShotCapability(options: AgentOptions): boolean {
  return options.profile.capabilities.some((capability) => /phone|staff|camera|film|shot|reels|tiktok/i.test(capability));
}

function ageInDays(value: string): number {
  return Math.max(0, (Date.now() - Date.parse(value)) / 86_400_000);
}
