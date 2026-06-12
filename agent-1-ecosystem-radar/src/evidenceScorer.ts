import type { CompetitorSignal, CurrentCapability, EvidenceSource } from "./types.js";

const ecosystems = [
  "Codex",
  "Claude Code",
  "Cursor",
  "GitHub Copilot",
  "LangGraph",
  "LangChain",
  "OpenClaw"
] as const;

export type EcosystemSignal = {
  ecosystem: string;
  sourceCount: number;
  officialSignals: number;
  communitySignals: number;
  competitorSignals: number;
  painSignals: number;
  urls: string[];
  score: number;
};

export type EvidenceAnalysis = {
  ecosystemSignals: EcosystemSignal[];
  currentCapabilities: CurrentCapability[];
  competitorSignals: CompetitorSignal[];
};

export function analyzeEvidence(sources: EvidenceSource[]): EvidenceAnalysis {
  return {
    ecosystemSignals: scoreEcosystems(sources),
    currentCapabilities: detectCurrentCapabilities(sources),
    competitorSignals: detectCompetitorSignals(sources)
  };
}

export function scoreEcosystems(sources: EvidenceSource[]): EcosystemSignal[] {
  return ecosystems
    .map((ecosystem) => {
      const matching = sources
        .filter((source) => mentions(source, ecosystem))
        .sort((a, b) => sourceQuality(b) - sourceQuality(a));
      const officialSignals = matching.filter(isOfficialLike).length;
      const communitySignals = matching.filter(isCommunityLike).length;
      const competitorSignals = matching.filter(hasCompetitorSignal).length;
      const painSignals = matching.filter(hasPainSignal).length;
      const score =
        matching.length * 2 +
        officialSignals * 3 +
        communitySignals * 2 +
        competitorSignals * 2 +
        painSignals * 3;

      return {
        ecosystem,
        sourceCount: matching.length,
        officialSignals,
        communitySignals,
        competitorSignals,
        painSignals,
        urls: matching.map((source) => source.url),
        score
      };
    })
    .sort((a, b) => b.score - a.score);
}

function detectCurrentCapabilities(sources: EvidenceSource[]): CurrentCapability[] {
  const capabilities: CurrentCapability[] = [];
  const brightDataSources = sources.filter((source) => /brightdata\.com|docs\.brightdata\.com|github\.com\/brightdata/i.test(source.url));

  if (brightDataSources.some((source) => /vscode|copilot|mcp-enabled chat/i.test(`${source.title} ${source.signal} ${source.content ?? ""}`))) {
    capabilities.push({
      capability: "VS Code / GitHub Copilot MCP connection",
      status: "already_exists",
      implication: "Do not recommend a generic VS Code MCP setup as the main bet; recommend packaging, validation, recipes, or an ecosystem-specific kit on top.",
      evidenceUrls: uniqueUrls(brightDataSources)
    });
  }

  if (brightDataSources.some((source) => /claude code|claude agent sdk|anthropic/i.test(`${source.title} ${source.signal} ${source.content ?? ""}`))) {
    capabilities.push({
      capability: "Claude-oriented Bright Data MCP guides or skills",
      status: "partial",
      implication: "Claude support exists, so the next bet should clarify whether the missing piece is Codex/Copilot/Cursor packaging or deeper Claude production recipes.",
      evidenceUrls: uniqueUrls(brightDataSources)
    });
  }

  if (brightDataSources.some((source) => /60\+ tools|search|scraping|structured data|browser automation|web data/i.test(`${source.title} ${source.signal} ${source.content ?? ""}`))) {
    capabilities.push({
      capability: "Broad Bright Data MCP tool surface",
      status: "already_exists",
      implication: "The gap is not raw capability; it is discoverability, first-run setup, ecosystem-specific instructions, and proof that the tools work inside coding-agent workflows.",
      evidenceUrls: uniqueUrls(brightDataSources)
    });
  }

  if (!capabilities.length) {
    capabilities.push({
      capability: "Bright Data current integration footprint",
      status: "gap",
      implication: "Selected evidence did not include enough Bright Data-owned sources; manually verify existing docs before committing engineering capacity.",
      evidenceUrls: []
    });
  }

  return capabilities;
}

function detectCompetitorSignals(sources: EvidenceSource[]): CompetitorSignal[] {
  const competitors = [
    { name: "Dawn", pattern: /dawnhq|dawn/i },
    { name: "CopilotKit", pattern: /copilotkit/i },
    { name: "LobeHub", pattern: /lobehub/i },
    { name: "Moderne", pattern: /moderne/i },
    { name: "Firecrawl", pattern: /firecrawl/i },
    { name: "Apify", pattern: /apify/i }
  ];

  return competitors
    .map((competitor) => {
      const matching = sources.filter((source) => competitor.pattern.test(`${source.url} ${source.title} ${source.signal} ${source.content ?? ""}`));
      if (!matching.length) return null;

      return {
        competitor: competitor.name,
        shipped: inferShipped(competitor.name, matching),
        whatWorksWell: inferWorksWell(competitor.name),
        weaknessOrGap: inferWeakness(competitor.name),
        implicationForBrightData: inferImplication(competitor.name),
        evidenceUrls: uniqueUrls(matching)
      } satisfies CompetitorSignal;
    })
    .filter((signal): signal is CompetitorSignal => Boolean(signal));
}

function inferShipped(competitor: string, sources: EvidenceSource[]): string {
  const joined = sources.map((source) => `${source.title} ${source.signal}`).join(" ");
  if (/mcp server/i.test(joined)) return `${competitor} shipped or is listed around an MCP server/workflow integration.`;
  if (/agent|coding/i.test(joined)) return `${competitor} shipped agent-oriented coding workflow support or content.`;
  return `${competitor} appears in selected evidence as an adjacent ecosystem or competitor signal.`;
}

function inferWorksWell(competitor: string): string {
  if (competitor === "Dawn") return "It presents a concrete cross-ecosystem MCP story across Codex, Cursor, and Copilot.";
  if (competitor === "CopilotKit") return "It packages agent building as developer-facing docs and reusable project skills.";
  if (competitor === "LobeHub") return "It makes MCP server discovery and setup instructions easy to browse.";
  if (competitor === "Moderne") return "It focuses on codebase context and execution, a clear pain point for coding agents.";
  return "It appears to package a narrower first-run developer story than a broad platform page.";
}

function inferWeakness(competitor: string): string {
  if (competitor === "Dawn") return "The evidence shows an example integration, not necessarily Bright Data-level live-web data depth.";
  if (competitor === "CopilotKit") return "It is not primarily a web data infrastructure provider.";
  if (competitor === "LobeHub") return "Registry presence can indicate discoverability more than production readiness.";
  if (competitor === "Moderne") return "Its strength is codebase context, not general live-web access.";
  return "Selected evidence does not prove production usage or durability.";
}

function inferImplication(competitor: string): string {
  if (competitor === "Dawn") return "Bright Data should match the cross-ecosystem packaging clarity while differentiating on live-web reliability.";
  if (competitor === "CopilotKit") return "Bright Data should ship copy-paste recipes and project skills, not only platform documentation.";
  if (competitor === "LobeHub") return "Bright Data should ensure its MCP server is easy to find, compare, and install in popular MCP directories.";
  if (competitor === "Moderne") return "Bright Data should position live web as complementary context that coding agents cannot get from repo-only tools.";
  return "Bright Data should convert platform depth into first-run ecosystem-specific assets.";
}

function uniqueUrls(sources: EvidenceSource[]): string[] {
  return [...new Set(sources.map((source) => source.url))].slice(0, 4);
}

function sourceQuality(source: EvidenceSource): number {
  return (isOfficialLike(source) ? 3 : 0) + (isCommunityLike(source) ? 2 : 0) + (hasPainSignal(source) ? 1 : 0);
}

function mentions(source: EvidenceSource, ecosystem: string): boolean {
  const haystack = `${source.title} ${source.signal} ${source.content ?? ""}`.toLowerCase();
  const aliases: Record<string, string[]> = {
    Codex: ["codex", "openai"],
    "Claude Code": ["claude code", "anthropic"],
    Cursor: ["cursor"],
    "GitHub Copilot": ["github copilot", "copilot"],
    LangGraph: ["langgraph"],
    LangChain: ["langchain"],
    OpenClaw: ["openclaw"]
  };

  return (aliases[ecosystem] ?? [ecosystem.toLowerCase()]).some((alias) => haystack.includes(alias));
}

function isOfficialLike(source: EvidenceSource): boolean {
  return /brightdata\.com|docs\.brightdata\.com|openai\.com|anthropic\.com|github\.com|docs\.cursor\.com|langchain\.com|langchain-ai\.github\.io|modelcontextprotocol\.io/i.test(
    source.url
  );
}

function isCommunityLike(source: EvidenceSource): boolean {
  return /reddit\.com|stackoverflow\.com|news\.ycombinator\.com|dev\.to|medium\.com|github\.com\/.*\/issues|github\.com\/.*\/discussions/i.test(
    source.url
  );
}

function hasCompetitorSignal(source: EvidenceSource): boolean {
  const text = `${source.title} ${source.signal} ${source.content ?? ""}`.toLowerCase();
  return /firecrawl|apify|exa|tavily|scraperapi|browserbase|jina/.test(text);
}

function hasPainSignal(source: EvidenceSource): boolean {
  const text = `${source.title} ${source.signal} ${source.content ?? ""}`.toLowerCase();
  return /pain|struggle|issue|problem|blocked|timeout|configuration|setup|docs|missing|fail|error|integration/.test(text);
}
