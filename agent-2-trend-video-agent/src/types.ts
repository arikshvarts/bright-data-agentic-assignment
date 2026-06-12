export type ScrapeStatus = "not_attempted" | "ok" | "partial" | "failed" | "metadata_only";

export type Platform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "reddit"
  | "x"
  | "google"
  | "article"
  | "creative_center"
  | "unknown";

export type ProductionMode = "human_shot" | "ai_generated" | "hybrid";

export type CreatorProfile = {
  businessName: string;
  profile: string;
  niche: string;
  audience: string;
  location: string;
  language: string;
  goal: string;
  capabilities: string[];
};

export type AgentOptions = {
  profile: CreatorProfile;
  region: string;
  maxSources: number;
  maxTrends: number;
};

export type TrendEvidence = {
  url: string;
  platform: Platform;
  title: string;
  sourceType: "search" | "discover";
  snippet: string;
  confidence: number;
  scrapeStatus: ScrapeStatus;
  content?: string;
  error?: string;
  recencyHint?: string;
  regionHint?: string;
  engagementHint?: string;
};

export type TrendCandidate = {
  name: string;
  platform: Platform | "cross_platform";
  format: string;
  topic: string;
  score: number;
  evidenceStrength: "low" | "medium" | "high";
  nicheFit: "low" | "medium" | "high";
  locationFit: "low" | "medium" | "high";
  productionFit: "low" | "medium" | "high";
  brandSafety: "low" | "medium" | "high";
  fitRationale: string;
  risks: string[];
  exampleUrls: string[];
  confidence: number;
};

export type CreativeConcept = {
  title: string;
  trendName: string;
  hook: string;
  format: string;
  caption: string;
  executionStyle: string;
  productionMode: ProductionMode;
  scenePlan: string[];
  shotList: string[];
  aiVideoPrompt?: string;
  confidence: number;
};

export type FutureVideoPipelineDraft = {
  videoSubject: string;
  language: string;
  aspectRatio: "9:16";
  voiceoverScript: string;
  scenePlan: string[];
  materialKeywords: string[];
  caption: string;
  bgmMood: string;
  productionMode: ProductionMode;
};

export type TrendVideoReport = {
  profile: CreatorProfile;
  region: string;
  generatedAt: string;
  toolsUsed: string[];
  summary: string;
  rankedTrends: TrendCandidate[];
  recommendedConcept: CreativeConcept;
  evidenceLog: TrendEvidence[];
  failureNotes: string[];
  tradeoff: string;
  nextSteps: string[];
  futureVideoPipelineDraft: FutureVideoPipelineDraft;
};

export type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

export type ToolClient = {
  callTool<T = unknown>(call: ToolCall): Promise<T>;
  close(): Promise<void>;
};
