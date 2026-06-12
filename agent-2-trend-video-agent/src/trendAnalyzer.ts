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
    name: "Cozy work/study POV",
    format: "POV micro-vlog",
    topic: "show the cafe as a tiny weekday productivity escape",
    patterns: [/pov|study|work|remote|cafe|coffee shop|cozy|day in my life|vlog/i],
    productionMode: "human_shot"
  },
  {
    name: "Behind-the-counter ASMR",
    format: "sensory process video",
    topic: "close-up drink and pastry preparation",
    patterns: [/asmr|behind the scenes|barista|latte|coffee|pastry|satisfying|process/i],
    productionMode: "human_shot"
  },
  {
    name: "Local hidden gem",
    format: "neighborhood discovery",
    topic: "position the business as a local place worth finding",
    patterns: [/hidden gem|local|tel aviv|israel|neighborhood|where to go|places/i],
    productionMode: "human_shot"
  },
  {
    name: "Nostalgia / 2016 reset",
    format: "throwback remix",
    topic: "use current nostalgia formats without forcing a dance trend",
    patterns: [/2016|nostalgia|throwback|bringback|reset|retro|photobooth/i],
    productionMode: "hybrid",
    risk: "Nostalgia trends can feel forced if the business has no personal or visual connection to the era."
  },
  {
    name: "Absurd low-stakes humor",
    format: "brainrot-lite brand joke",
    topic: "use unserious humor around coffee, studying, and weekday motivation",
    patterns: [/brain rot|brainrot|unserious|meme|humor|funny|aura|aura farming/i],
    productionMode: "hybrid",
    risk: "Humor should stay brand-safe and local; avoid copying insensitive formats."
  },
  {
    name: "Mini guide / listicle",
    format: "3 reasons / 3 spots / 3 orders",
    topic: "convert trend evidence into practical local recommendations",
    patterns: [/guide|tips|best|top|three|3|list|things to do|where/i],
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

  const selected = candidates.length ? candidates : fallbackCandidates(options, evidence);
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
  const sourceDiversity = new Set(matching.map((source) => source.platform)).size;

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
    sourceDiversity,
    fitRationale: `${pattern.name} fits ${options.profile.businessName} because it maps the trend format to ${options.profile.niche}, ${options.profile.audience}, and the goal to ${options.profile.goal}.`,
    risks: pattern.risk ? [pattern.risk] : [],
    exampleUrls: [...new Set(matching.map((source) => source.url))].slice(0, 4),
    confidence: Math.max(0.52, Math.min(0.9, 0.48 + score / 50))
  };
}

function fallbackCandidates(options: AgentOptions, evidence: TrendEvidence[]): TrendCandidate[] {
  return evidence.slice(0, Math.max(3, options.maxTrends)).map((source, index) => ({
    name: `${source.platform === "unknown" ? "Cross-platform" : source.platform} trend adaptation`,
    platform: source.platform === "unknown" ? "cross_platform" : source.platform,
    format: index === 0 ? "POV micro-vlog" : index === 1 ? "sensory process video" : "mini guide",
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
    fitRationale: `Selected as a fallback because the source survived discovery and can be adapted to ${options.profile.niche}.`,
    risks: ["Trend label is inferred from limited evidence; manually review before posting."],
    exampleUrls: [source.url],
    confidence: 0.58
  }));
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
  const text = sources.map(evidenceText).join(" ").toLowerCase();
  if (/\b(today|this week|4 days ago|new|latest|new to top|emerging)\b/.test(text)) return "emerging";
  if (/\b(2026|recent|rising|trendline|growth|popular now)\b/.test(text)) return "rising";
  if (/\b(guide|evergreen|how to|best|tips)\b/.test(text)) return "evergreen";
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
