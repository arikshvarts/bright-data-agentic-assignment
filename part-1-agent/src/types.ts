export type ScrapeStatus = "not_attempted" | "ok" | "partial" | "failed";

export type EvidenceSource = {
  url: string;
  title: string;
  sourceType: "search" | "discover";
  signal: string;
  confidence: number;
  scrapeStatus: ScrapeStatus;
  content?: string;
  error?: string;
};

export type IntegrationOpportunity = {
  opportunity: string;
  ecosystem: string;
  evidenceStrength: "low" | "medium" | "high";
  developerPain: "low" | "medium" | "high";
  adoptionSignal: "low" | "medium" | "high";
  implementationEffort: "low" | "medium" | "high";
  priority: number;
  rationale: string;
  evidenceUrls: string[];
  contradictorySignals: string[];
  confidence: number;
};

export type RecommendedBet = {
  title: string;
  targetDeveloper: string;
  problemSolved: string;
  whyNow: string;
  minimumViableScope: string[];
  successMetric: string;
  whatNotToBuildYet: string[];
  evidenceUrls: string[];
  confidence: number;
};

export type CurrentCapability = {
  capability: string;
  status: "already_exists" | "partial" | "gap";
  implication: string;
  evidenceUrls: string[];
};

export type CompetitorSignal = {
  competitor: string;
  shipped: string;
  whatWorksWell: string;
  weaknessOrGap: string;
  implicationForBrightData: string;
  evidenceUrls: string[];
};

export type RadarReport = {
  company: string;
  decision: string;
  region: string;
  generatedAt: string;
  summary: string;
  toolsUsed: string[];
  currentCapabilities: CurrentCapability[];
  competitorAnalysis: CompetitorSignal[];
  rankedOpportunities: IntegrationOpportunity[];
  recommendedBet: RecommendedBet;
  evidenceSources: EvidenceSource[];
  tradeoff: string;
  nextSteps: string[];
};

export type AgentOptions = {
  company: string;
  decision: string;
  region: string;
  maxSources: number;
};

export type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

export type ToolClient = {
  callTool<T = unknown>(call: ToolCall): Promise<T>;
  close(): Promise<void>;
};
