import OpenAI from "openai";
import type { AgentOptions, CompetitorSignal, CurrentCapability, EvidenceSource, IntegrationOpportunity, RadarReport, RecommendedBet } from "./types.js";
import { repairText } from "./textRepair.js";
import type { EvidenceAnalysis } from "./evidenceScorer.js";

type ReportShape = {
  summary: string;
  currentCapabilities: CurrentCapability[];
  competitorAnalysis: CompetitorSignal[];
  rankedOpportunities: IntegrationOpportunity[];
  recommendedBet: RecommendedBet;
  nextSteps: string[];
};

export async function synthesizeReport(
  options: AgentOptions,
  sources: EvidenceSource[],
  evidenceAnalysis: EvidenceAnalysis
): Promise<RadarReport> {
  const parsed = repairReportShape(await synthesizeReportShapeWithFallback(options, sources, evidenceAnalysis));

  return {
    company: options.company,
    decision: options.decision,
    region: options.region,
    generatedAt: new Date().toISOString(),
    summary: parsed.summary,
    toolsUsed: ["search_engine", "discover", "scrape_as_markdown"],
    currentCapabilities: parsed.currentCapabilities,
    competitorAnalysis: parsed.competitorAnalysis,
    rankedOpportunities: parsed.rankedOpportunities,
    recommendedBet: parsed.recommendedBet,
    evidenceSources: sources,
    tradeoff:
      "Used free-tier-friendly Bright Data MCP tools for reproducibility, then applied deterministic ecosystem scoring before LLM synthesis.",
    nextSteps: parsed.nextSteps
  };
}

async function synthesizeReportShapeWithFallback(
  options: AgentOptions,
  sources: EvidenceSource[],
  evidenceAnalysis: EvidenceAnalysis
): Promise<ReportShape> {
  try {
    return await synthesizeReportShape(options, sources, evidenceAnalysis);
  } catch (error) {
    console.warn(`LLM synthesis failed, using deterministic fallback: ${safeMessage(error)}`);
    return fallbackReportShape(options, sources, evidenceAnalysis);
  }
}

async function synthesizeReportShape(
  options: AgentOptions,
  sources: EvidenceSource[],
  evidenceAnalysis: EvidenceAnalysis
): Promise<ReportShape> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key;
  if (anthropicKey) return synthesizeWithAnthropic(options, sources, evidenceAnalysis, anthropicKey);

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) return synthesizeWithOpenAI(options, sources, evidenceAnalysis, openaiKey);

  throw new Error("Missing LLM key. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.");
}

async function synthesizeWithOpenAI(
  options: AgentOptions,
  sources: EvidenceSource[],
  evidenceAnalysis: EvidenceAnalysis,
  apiKey: string
): Promise<ReportShape> {
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "gtm_radar_report",
        strict: true,
        schema: reportSchema
      }
    },
    messages: [
      {
        role: "system",
        content:
          decisionSystemPrompt
      },
      {
        role: "user",
        content: JSON.stringify({
          company: options.company,
          decision: options.decision,
          region: options.region,
          deterministicEvidenceAnalysis: evidenceAnalysis,
          evidenceSources: sources.map((source) => ({
            url: source.url,
            title: source.title,
            signal: source.signal,
            scrapeStatus: source.scrapeStatus,
            content: source.content?.slice(0, 2500)
          }))
        })
      }
    ]
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI returned an empty report.");

  return JSON.parse(content) as ReportShape;
}

async function synthesizeWithAnthropic(
  options: AgentOptions,
  sources: EvidenceSource[],
  evidenceAnalysis: EvidenceAnalysis,
  apiKey: string
): Promise<ReportShape> {
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      temperature: 0.2,
      system: decisionSystemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            task: "Create a ranked integration-decision report. Recommend which coding-agent ecosystem integration the company should build next and what exactly to ship in 90 days.",
            outputSchema: reportSchema,
            company: options.company,
            decision: options.decision,
            region: options.region,
            deterministicEvidenceAnalysis: evidenceAnalysis,
            evidenceSources: sources.map((source) => ({
              url: source.url,
              title: source.title,
              signal: source.signal,
              scrapeStatus: source.scrapeStatus,
              content: source.content?.slice(0, 2500)
            }))
          })
        }
      ]
    })
  });

  const payload = (await response.json()) as AnthropicResponse;
  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${payload.error?.message ?? response.statusText}`);
  }

  const content = payload.content?.find((part) => part.type === "text")?.text;
  if (!content) throw new Error("Anthropic returned an empty report.");

  return JSON.parse(extractJson(content)) as ReportShape;
}

function extractJson(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);

  throw new Error("LLM response did not contain a JSON object.");
}

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "currentCapabilities", "competitorAnalysis", "rankedOpportunities", "recommendedBet", "nextSteps"],
  properties: {
    summary: { type: "string" },
    currentCapabilities: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["capability", "status", "implication", "evidenceUrls"],
        properties: {
          capability: { type: "string" },
          status: { type: "string", enum: ["already_exists", "partial", "gap"] },
          implication: { type: "string" },
          evidenceUrls: { type: "array", items: { type: "string" } }
        }
      }
    },
    competitorAnalysis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["competitor", "shipped", "whatWorksWell", "weaknessOrGap", "implicationForBrightData", "evidenceUrls"],
        properties: {
          competitor: { type: "string" },
          shipped: { type: "string" },
          whatWorksWell: { type: "string" },
          weaknessOrGap: { type: "string" },
          implicationForBrightData: { type: "string" },
          evidenceUrls: { type: "array", minItems: 1, items: { type: "string" } }
        }
      }
    },
    rankedOpportunities: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "opportunity",
          "ecosystem",
          "evidenceStrength",
          "developerPain",
          "adoptionSignal",
          "implementationEffort",
          "priority",
          "rationale",
          "evidenceUrls",
          "contradictorySignals",
          "confidence"
        ],
        properties: {
          opportunity: { type: "string" },
          ecosystem: { type: "string" },
          evidenceStrength: { type: "string", enum: ["low", "medium", "high"] },
          developerPain: { type: "string", enum: ["low", "medium", "high"] },
          adoptionSignal: { type: "string", enum: ["low", "medium", "high"] },
          implementationEffort: { type: "string", enum: ["low", "medium", "high"] },
          priority: { type: "number", minimum: 1, maximum: 5 },
          rationale: { type: "string" },
          evidenceUrls: {
            type: "array",
            minItems: 1,
            items: { type: "string" }
          },
          contradictorySignals: {
            type: "array",
            items: { type: "string" }
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          }
        }
      }
    },
    recommendedBet: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "targetDeveloper",
        "problemSolved",
        "whyNow",
        "minimumViableScope",
        "successMetric",
        "whatNotToBuildYet",
        "evidenceUrls",
        "confidence"
      ],
      properties: {
        title: { type: "string" },
        targetDeveloper: { type: "string" },
        problemSolved: { type: "string" },
        whyNow: { type: "string" },
        minimumViableScope: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
        successMetric: { type: "string" },
        whatNotToBuildYet: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
        evidenceUrls: { type: "array", minItems: 1, items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 }
      }
    },
    nextSteps: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" }
    }
  }
} as const;

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
};

function repairReportShape(report: ReportShape): ReportShape {
  return {
    summary: repairText(report.summary),
    currentCapabilities: report.currentCapabilities.map((capability) => ({
      ...capability,
      capability: repairText(capability.capability),
      implication: repairText(capability.implication)
    })),
    competitorAnalysis: report.competitorAnalysis.map((signal) => ({
      ...signal,
      competitor: repairText(signal.competitor),
      shipped: repairText(signal.shipped),
      whatWorksWell: repairText(signal.whatWorksWell),
      weaknessOrGap: repairText(signal.weaknessOrGap),
      implicationForBrightData: repairText(signal.implicationForBrightData)
    })),
    rankedOpportunities: report.rankedOpportunities.map((opportunity) => ({
      ...opportunity,
      opportunity: repairText(opportunity.opportunity),
      ecosystem: repairText(opportunity.ecosystem),
      rationale: repairText(opportunity.rationale),
      contradictorySignals: opportunity.contradictorySignals.map(repairText)
    })),
    recommendedBet: {
      ...report.recommendedBet,
      title: repairText(report.recommendedBet.title),
      targetDeveloper: repairText(report.recommendedBet.targetDeveloper),
      problemSolved: repairText(report.recommendedBet.problemSolved),
      whyNow: repairText(report.recommendedBet.whyNow),
      minimumViableScope: report.recommendedBet.minimumViableScope.map(repairText),
      successMetric: repairText(report.recommendedBet.successMetric),
      whatNotToBuildYet: report.recommendedBet.whatNotToBuildYet.map(repairText)
    },
    nextSteps: report.nextSteps.map(repairText)
  };
}

function fallbackReportShape(
  options: AgentOptions,
  sources: EvidenceSource[],
  evidenceAnalysis: EvidenceAnalysis
): ReportShape {
  const ecosystemSignals = evidenceAnalysis.ecosystemSignals;
  const usableSignals = ecosystemSignals.filter((signal) => signal.sourceCount > 0).slice(0, 4);
  const selectedSignals = usableSignals.length
    ? usableSignals
    : [{ ecosystem: "Codex", sourceCount: sources.length, officialSignals: 0, communitySignals: 0, competitorSignals: 0, painSignals: 0, urls: sources.map((source) => source.url), score: sources.length }];

  const rankedOpportunities: IntegrationOpportunity[] = selectedSignals.map((signal, index) => ({
    opportunity: `${signal.ecosystem} integration kit`,
    ecosystem: signal.ecosystem,
    evidenceStrength: signal.officialSignals > 0 && signal.sourceCount >= 2 ? "high" : signal.sourceCount >= 2 ? "medium" : "low",
    developerPain: signal.painSignals > 0 ? "high" : "medium",
    adoptionSignal: signal.sourceCount >= 2 || signal.officialSignals > 0 ? "high" : "medium",
    implementationEffort: signal.ecosystem === "LangGraph" || signal.ecosystem === "LangChain" ? "low" : "medium",
    priority: index + 1,
    rationale: `${signal.ecosystem} has ${signal.sourceCount} selected evidence source(s), ${signal.officialSignals} official-like signal(s), ${signal.communitySignals} community signal(s), and ${signal.painSignals} developer-pain signal(s).`,
    evidenceUrls: signal.urls.slice(0, 3),
    contradictorySignals: signal.officialSignals === 0 ? ["No official source was selected for this ecosystem."] : [],
    confidence: Math.max(0.55, Math.min(0.86, 0.5 + signal.score / 60 - index * 0.03))
  }));

  const top = rankedOpportunities[0];
  const evidenceUrls = top?.evidenceUrls.length ? top.evidenceUrls : sources.slice(0, 3).map((source) => source.url);

  return {
    summary: `${options.company} should treat "${options.decision}" as an integration-capacity decision, not a broad market-research task. The strongest selected signal points to ${top?.ecosystem ?? "Codex"}, with priority based on source count, official-like evidence, community evidence, competitor mentions, and developer-pain terms.`,
    currentCapabilities: evidenceAnalysis.currentCapabilities,
    competitorAnalysis: evidenceAnalysis.competitorSignals,
    rankedOpportunities,
    recommendedBet: {
      title: `Build a first-party ${top?.ecosystem ?? "Codex"} integration kit`,
      targetDeveloper: "Developer relations, platform engineers, and coding-agent power users",
      problemSolved: "Reduce setup friction for reliable Bright Data live-web access inside coding-agent workflows.",
      whyNow: "Coding-agent ecosystems are competing on tool access, MCP interoperability, and first-run developer experience.",
      minimumViableScope: [
        "Preconfigured Bright Data MCP setup",
        "Reusable agent instructions for the target ecosystem",
        "Three production recipes using search, discovery, and scraping",
        "Connectivity validation command",
        "Short troubleshooting guide for common MCP failures"
      ],
      successMetric: "50 successful first-run demos and 10 external developer feedback sessions within 30 days of release.",
      whatNotToBuildYet: [
        "A full native SDK before validating activation",
        "A broad UI before proving command-line workflow demand",
        "Pro-mode-only features that block free-account evaluation"
      ],
      evidenceUrls,
      confidence: top?.confidence ?? 0.68
    },
    nextSteps: [
      "Manually review the top evidence URLs for source quality and official-vs-community status.",
      "Prototype the recommended integration kit with a one-command connectivity check.",
      "Recruit five developers from the target ecosystem to run the kit cold and report setup friction.",
      "Track activation, successful MCP tool calls, and time-to-first-useful-report."
    ]
  };
}

function safeMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300);
}

const decisionSystemPrompt =
  "You are a senior product strategist for agent infrastructure. Use only the provided web evidence and deterministic evidence analysis. Produce a decision artifact, not generic market research. First identify what the requested company already has so you do not recommend a redundant generic integration. Then analyze competitors/comparables: what they shipped, what works well, what is weak, and what it implies for the company. Rank coding-agent ecosystem integration opportunities for the requested company and decision. Evaluate official support, documentation gaps, GitHub/community pain, competitor presence, package or repository activity, recent announcements, implementation effort, confidence, and contradictory signals. Prefer primary sources, official docs, reputable news, analyst studies, GitHub issues/discussions, and first-hand community evidence over SEO statistic roundups. Recommend one concrete 90-day bet with target developer, problem solved, why now, minimum viable scope, success metric, and what not to build yet. Return only valid JSON that matches the schema.";
