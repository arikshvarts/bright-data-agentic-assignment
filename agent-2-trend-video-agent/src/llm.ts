import OpenAI from "openai";
import type {
  AgentOptions,
  CreativeConcept,
  FutureVideoPipelineDraft,
  ToolTelemetry,
  TrendCandidate,
  TrendEvidence,
  TrendVideoReport
} from "./types.js";
import { repairText } from "./textRepair.js";

type ReportShape = {
  summary: string;
  rankedTrends: TrendCandidate[];
  recommendedConcept: CreativeConcept;
  nextSteps: string[];
};

export async function synthesizeTrendVideoReport(
  options: AgentOptions,
  evidence: TrendEvidence[],
  candidates: TrendCandidate[],
  failureNotes: string[],
  toolTelemetry: ToolTelemetry[]
): Promise<TrendVideoReport> {
  const parsed = completeReportShape(
    repairReportShape(await synthesizeReportShapeWithFallback(options, evidence, candidates, failureNotes)),
    candidates,
    options
  );
  const futureVideoPipelineDraft = buildFuturePipelineDraft(options, parsed.recommendedConcept);

  return {
    analysisVersion: "2.0",
    profile: options.profile,
    region: options.region,
    generatedAt: new Date().toISOString(),
    toolsUsed: [...new Set(toolTelemetry.filter((entry) => entry.status === "ok").map((entry) => entry.name))],
    toolTelemetry,
    summary: parsed.summary,
    rankedTrends: parsed.rankedTrends,
    recommendedConcept: parsed.recommendedConcept,
    evidenceLog: evidence,
    failureNotes,
    tradeoff:
      "Defaulted to Bright Data MCP free-tier tools for reproducibility. Pro/social extractors would improve structured TikTok, YouTube, X, and Reddit metadata in production.",
    nextSteps: parsed.nextSteps,
    futureVideoPipelineDraft
  };
}

async function synthesizeReportShapeWithFallback(
  options: AgentOptions,
  evidence: TrendEvidence[],
  candidates: TrendCandidate[],
  failureNotes: string[]
): Promise<ReportShape> {
  try {
    return await synthesizeReportShape(options, evidence, candidates, failureNotes);
  } catch (error) {
    console.warn(`LLM synthesis failed, using deterministic fallback: ${safeMessage(error)}`);
    return fallbackReportShape(options, candidates);
  }
}

async function synthesizeReportShape(
  options: AgentOptions,
  evidence: TrendEvidence[],
  candidates: TrendCandidate[],
  failureNotes: string[]
): Promise<ReportShape> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key;
  if (anthropicKey) return synthesizeWithAnthropic(options, evidence, candidates, failureNotes, anthropicKey);

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) return synthesizeWithOpenAI(options, evidence, candidates, failureNotes, openaiKey);

  throw new Error("Missing LLM key. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.");
}

async function synthesizeWithOpenAI(
  options: AgentOptions,
  evidence: TrendEvidence[],
  candidates: TrendCandidate[],
  failureNotes: string[],
  apiKey: string
): Promise<ReportShape> {
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "trend_video_report",
        strict: true,
        schema: reportSchema
      }
    },
    messages: [
      { role: "system", content: creativeSystemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          task: "Create a location-aware trend-to-video recommendation from the evidence.",
          profile: options.profile,
          rankedCandidates: candidates,
          failureNotes,
          evidence: compactEvidence(evidence)
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
  evidence: TrendEvidence[],
  candidates: TrendCandidate[],
  failureNotes: string[],
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
      max_tokens: 2800,
      temperature: 0.3,
      system: creativeSystemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            outputSchema: reportSchema,
            profile: options.profile,
            rankedCandidates: candidates,
            failureNotes,
            evidence: compactEvidence(evidence)
          })
        }
      ]
    })
  });

  const payload = (await response.json()) as AnthropicResponse;
  if (!response.ok) throw new Error(`Anthropic request failed: ${payload.error?.message ?? response.statusText}`);

  const content = payload.content?.find((part) => part.type === "text")?.text;
  if (!content) throw new Error("Anthropic returned an empty report.");
  return JSON.parse(extractJson(content)) as ReportShape;
}

function fallbackReportShape(options: AgentOptions, candidates: TrendCandidate[]): ReportShape {
  const rankedTrends = candidates.slice(0, options.maxTrends);
  const top = rankedTrends[0] ?? fallbackCandidate(options);
  const recommendedConcept = buildConceptFromCandidate(options, top);

  return {
    summary: `${options.profile.businessName} should adapt "${top.name}" into a short ${top.format} because it fits ${options.profile.niche}, ${options.profile.audience}, and the goal to ${options.profile.goal}.`,
    rankedTrends: rankedTrends.length ? rankedTrends : [top],
    recommendedConcept,
    nextSteps: [
      "Open the top evidence links and manually review the visual format before posting.",
      "Film a 20-35 second vertical version with the hook in the first two seconds.",
      "Post the same concept to TikTok and optionally YouTube Shorts, then compare saves, comments, and profile visits.",
      "Rerun the agent weekly to avoid stale trend copying."
    ]
  };
}

function completeReportShape(report: ReportShape, candidates: TrendCandidate[], options: AgentOptions): ReportShape {
  const candidateByName = new Map(candidates.map((candidate) => [candidate.name.toLowerCase(), candidate]));
  const seen = new Set(report.rankedTrends.map((trend) => trend.name.toLowerCase()));
  const filledTrends: TrendCandidate[] = report.rankedTrends.map((trend) => {
    const source = candidateByName.get(trend.name.toLowerCase());
    return {
      ...trend,
      trendStage: trend.trendStage ?? source?.trendStage ?? "unclear",
      validationLevel: trend.validationLevel ?? source?.validationLevel ?? "weak",
      sourceDiversity: (trend.sourceDiversity ?? source?.sourceDiversity ?? new Set(trend.exampleUrls.map((url) => urlDomain(url))).size) || 1,
      platformDiversity: trend.platformDiversity ?? source?.platformDiversity ?? 1,
      independentSourceCount: trend.independentSourceCount ?? source?.independentSourceCount ?? trend.sourceDiversity ?? 1,
      velocityScore: trend.velocityScore ?? source?.velocityScore,
      velocityLabel: trend.velocityLabel ?? source?.velocityLabel,
      velocityBasis: trend.velocityBasis ?? source?.velocityBasis,
      saturationScore: trend.saturationScore ?? source?.saturationScore,
      saturationLabel: trend.saturationLabel ?? source?.saturationLabel,
      saturationBasis: trend.saturationBasis ?? source?.saturationBasis
    };
  });

  for (const candidate of candidates) {
    if (filledTrends.length >= Math.min(options.maxTrends, 3)) break;
    if (seen.has(candidate.name.toLowerCase())) continue;
    filledTrends.push(normalizeTrend(candidate));
    seen.add(candidate.name.toLowerCase());
  }

  return {
    ...report,
    rankedTrends: filledTrends.slice(0, options.maxTrends)
  };
}

function normalizeTrend(trend: TrendCandidate): TrendCandidate {
  return {
    ...trend,
    trendStage: trend.trendStage ?? "unclear",
    validationLevel: trend.validationLevel ?? "weak",
    sourceDiversity: (trend.sourceDiversity ?? new Set(trend.exampleUrls.map((url) => urlDomain(url))).size) || 1,
    platformDiversity: trend.platformDiversity ?? 1,
    independentSourceCount: trend.independentSourceCount ?? trend.sourceDiversity ?? 1
  };
}

function urlDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function buildConceptFromCandidate(options: AgentOptions, candidate: TrendCandidate): CreativeConcept {
  const humanShot = candidate.productionFit === "high" || candidate.platform !== "cross_platform";
  const productionMode = humanShot ? candidate.platform === "creative_center" ? "hybrid" : "human_shot" : "hybrid";
  const location = options.profile.location.split(",")[0];
  const subject = options.profile.niche.split(",")[0].trim();
  const hook = `The ${subject} mistake ${options.profile.audience} keep making - and the practical fix.`;
  const scenePlan = [
    `0-2s: Open with the strongest proof, contrast, or audience pain related to ${subject}.`,
    `2-7s: Name the specific problem experienced by ${options.profile.audience}.`,
    `7-18s: Demonstrate how ${options.profile.businessName} addresses it using a real process, product, service, or expert action.`,
    "18-25s: Show one credible detail, result, or human proof point.",
    `25-30s: End with a direct action tied to the goal: ${options.profile.goal}.`
  ];

  return {
    title: `${candidate.name} for ${options.profile.businessName}`,
    trendName: candidate.name,
    hook,
    format: candidate.format,
    caption: `${candidate.name}, adapted for ${options.profile.businessName} in ${location}. Save this and take the next step.`,
    executionStyle: "Fast, credible vertical video using real proof, readable text overlays, and a human or product-led demonstration.",
    productionMode,
    scenePlan,
    shotList: [
      `Opening proof or problem visual related to ${subject}`,
      "Close-up of the product, workflow, service, or expert action",
      "Human reaction, customer context, or interface/result detail",
      "Credibility detail such as process step, comparison, or outcome",
      `Final branded frame with ${location} and the call to action`
    ],
    aiVideoPrompt:
      productionMode === "human_shot"
        ? undefined
        : `Vertical 9:16 short-form video for ${options.profile.businessName}, a ${options.profile.niche} brand in ${options.profile.location}. Show a credible problem-to-solution sequence for ${options.profile.audience}, authentic phone-shot texture, realistic people and objects, readable composition, no invented logos or unsupported outcomes.`,
    confidence: candidate.confidence
  };
}

function buildFuturePipelineDraft(options: AgentOptions, concept: CreativeConcept): FutureVideoPipelineDraft {
  return {
    videoSubject: concept.title,
    language: languageCode(options.profile.language),
    aspectRatio: "9:16",
    voiceoverScript: concept.scenePlan.join(" "),
    scenePlan: concept.scenePlan,
    materialKeywords: [
      options.profile.niche,
      options.profile.location,
      "vertical video",
      options.profile.audience,
      options.profile.goal,
      concept.trendName
    ],
    caption: concept.caption,
    bgmMood: concept.productionMode === "human_shot" ? "warm upbeat lo-fi" : "soft trending pop with cozy pacing",
    productionMode: concept.productionMode
  };
}

function fallbackCandidate(options: AgentOptions): TrendCandidate {
  return {
    name: "Problem-to-solution POV",
    platform: "cross_platform",
    format: "POV micro-vlog",
    topic: "show the audience problem, credible intervention, and practical result",
    score: 12,
    evidenceStrength: "low",
    nicheFit: "medium",
    locationFit: "low",
    productionFit: "high",
    brandSafety: "high",
    fitRationale: `General-purpose fallback format grounded in ${options.profile.businessName}, ${options.profile.audience}, and ${options.profile.goal}.`,
    risks: ["No strong trend cluster was available."],
    exampleUrls: [],
    confidence: 0.52
  };
}

function compactEvidence(evidence: TrendEvidence[]): unknown[] {
  return evidence.map((source) => ({
    url: source.url,
    platform: source.platform,
    title: source.title,
    snippet: source.snippet,
    scrapeStatus: source.scrapeStatus,
    content: source.content?.slice(0, 2200),
    error: source.error
  }));
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

function repairReportShape(report: ReportShape): ReportShape {
  return {
    summary: repairText(report.summary),
    rankedTrends: report.rankedTrends.map((trend) => ({
      ...trend,
      name: repairText(trend.name),
      format: repairText(trend.format),
      topic: repairText(trend.topic),
      fitRationale: repairText(trend.fitRationale),
      risks: trend.risks.map(repairText)
    })),
    recommendedConcept: {
      ...report.recommendedConcept,
      title: repairText(report.recommendedConcept.title),
      trendName: repairText(report.recommendedConcept.trendName),
      hook: repairText(report.recommendedConcept.hook),
      format: repairText(report.recommendedConcept.format),
      caption: repairText(report.recommendedConcept.caption),
      executionStyle: repairText(report.recommendedConcept.executionStyle),
      scenePlan: report.recommendedConcept.scenePlan.map(repairText),
      shotList: report.recommendedConcept.shotList.map(repairText),
      aiVideoPrompt: report.recommendedConcept.aiVideoPrompt ? repairText(report.recommendedConcept.aiVideoPrompt) : undefined
    },
    nextSteps: report.nextSteps.map(repairText)
  };
}

function languageCode(language: string): string {
  if (/hebrew|עברית/i.test(language)) return "he";
  if (/spanish|español/i.test(language)) return "es";
  return "en";
}

function safeMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .slice(0, 300);
}

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
};

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "rankedTrends", "recommendedConcept", "nextSteps"],
  properties: {
    summary: { type: "string" },
    rankedTrends: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "platform",
          "format",
          "topic",
          "score",
          "evidenceStrength",
          "nicheFit",
          "locationFit",
          "productionFit",
          "brandSafety",
          "fitRationale",
          "risks",
          "exampleUrls",
          "confidence"
        ],
        properties: {
          name: { type: "string" },
          platform: { type: "string" },
          format: { type: "string" },
          topic: { type: "string" },
          score: { type: "number" },
          evidenceStrength: { type: "string", enum: ["low", "medium", "high"] },
          nicheFit: { type: "string", enum: ["low", "medium", "high"] },
          locationFit: { type: "string", enum: ["low", "medium", "high"] },
          productionFit: { type: "string", enum: ["low", "medium", "high"] },
          brandSafety: { type: "string", enum: ["low", "medium", "high"] },
          fitRationale: { type: "string" },
          risks: { type: "array", items: { type: "string" } },
          exampleUrls: { type: "array", items: { type: "string" } },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    recommendedConcept: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "trendName",
        "hook",
        "format",
        "caption",
        "executionStyle",
        "productionMode",
        "scenePlan",
        "shotList",
        "aiVideoPrompt",
        "confidence"
      ],
      properties: {
        title: { type: "string" },
        trendName: { type: "string" },
        hook: { type: "string" },
        format: { type: "string" },
        caption: { type: "string" },
        executionStyle: { type: "string" },
        productionMode: { type: "string", enum: ["human_shot", "ai_generated", "hybrid"] },
        scenePlan: { type: "array", minItems: 4, items: { type: "string" } },
        shotList: { type: "array", minItems: 3, items: { type: "string" } },
        aiVideoPrompt: { type: ["string", "null"] },
        confidence: { type: "number", minimum: 0, maximum: 1 }
      }
    },
    nextSteps: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } }
  }
} as const;

const creativeSystemPrompt =
  "You are a senior social creative strategist and evidence-driven web agent. Use only the provided evidence and ranked candidates. Do not produce a generic trend list. Explain why each trend fits the business, audience, location, goal, and production capabilities. Prefer practical TikTok-first concepts validated by TikTok Discover/video URLs, YouTube Shorts, Reddit, reputable trend-intelligence sources, or Creative Center-style sources. Include conflict/weak evidence notes. Recommend exactly one production-ready concept with hook, format, caption, scene plan, shot list, execution style, production mode, and an AI-video prompt only when useful for ai_generated or hybrid production. Return only valid JSON matching the schema.";
