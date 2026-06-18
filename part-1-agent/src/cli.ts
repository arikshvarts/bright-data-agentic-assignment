import "dotenv/config";
import { Command } from "commander";
import { createBrightDataClient } from "./mcpBrightData.js";
import { persistReport, runTrendVideoAgent } from "./agent.js";
import { loadCreatorProfile } from "./profile.js";
import { renderConsoleSummary } from "./reportRenderer.js";
import type { AgentOptions } from "./types.js";
import { inferRegion } from "./region.js";

const program = new Command()
  .name("trend-to-video-agent")
  .description("Find location-aware social trends and turn them into a production-ready short-video concept.")
  .option("--business-name <name>", "Business or creator name")
  .option("--profile <profile>", "Short description of the business, creator, or account")
  .option("--profile-file <path>", "JSON or simple Markdown profile file")
  .option("--niche <niche>", "Niche or category")
  .option("--audience <audience>", "Target audience")
  .option("--location <location>", "Location or market")
  .option("--language <language>", "Output/content language")
  .option("--goal <goal>", "Content goal")
  .option("--capability <capability>", "Production capability; repeatable", collect, [] as string[])
  .option("--region <region>", "Two-letter search region; inferred from location when omitted")
  .option("--max-sources <number>", "Maximum evidence sources to scrape", process.env.MAX_SOURCES || "10")
  .option("--max-trends <number>", "Maximum trend candidates to return", process.env.MAX_TRENDS || "5")
  .option("--social-posts <number>", "Maximum direct TikTok posts to enrich", process.env.SOCIAL_ENRICH_MAX_POSTS || "1")
  .option("--social-comments <number>", "Maximum TikTok videos to enrich with comments", process.env.SOCIAL_ENRICH_MAX_COMMENTS || "0")
  .parse(process.argv);

const parsed = program.opts<{
  businessName?: string;
  profile?: string;
  profileFile?: string;
  niche?: string;
  audience?: string;
  location?: string;
  language?: string;
  goal?: string;
  capability: string[];
  region?: string;
  maxSources: string;
  maxTrends: string;
  socialPosts: string;
  socialComments: string;
}>();

process.env.SOCIAL_ENRICH_MAX_POSTS = parsed.socialPosts;
process.env.SOCIAL_ENRICH_MAX_COMMENTS = parsed.socialComments;

const profile = await loadCreatorProfile({
  businessName: parsed.businessName,
  profile: parsed.profile,
  profileFile: parsed.profileFile,
  niche: parsed.niche,
  audience: parsed.audience,
  location: parsed.location,
  language: parsed.language,
  goal: parsed.goal,
  capabilities: parsed.capability
});

const options: AgentOptions = {
  profile,
  region: (parsed.region ?? inferRegion(profile.location)).toLowerCase(),
  maxSources: Number.parseInt(parsed.maxSources, 10),
  maxTrends: Number.parseInt(parsed.maxTrends, 10)
};

if (!Number.isInteger(options.maxSources) || options.maxSources < 3 || options.maxSources > 20) {
  console.error("--max-sources must be an integer between 3 and 20.");
  process.exit(1);
}

if (!Number.isInteger(options.maxTrends) || options.maxTrends < 3 || options.maxTrends > 8) {
  console.error("--max-trends must be an integer between 3 and 8.");
  process.exit(1);
}

for (const [flag, value, maximum] of [
  ["--social-posts", parsed.socialPosts, 8],
  ["--social-comments", parsed.socialComments, 4]
] as const) {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > maximum) {
    console.error(`${flag} must be an integer between 0 and ${maximum}.`);
    process.exit(1);
  }
}

const client = await createBrightDataClient();

try {
  const report = await runTrendVideoAgent(options, client);
  const paths = await persistReport(report);
  console.log(renderConsoleSummary(report));
  console.log(`Markdown report: ${paths.markdownPath}`);
  console.log(`JSON report: ${paths.jsonPath}`);
  console.log(`Evidence dashboard: ${paths.dashboardPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.close();
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}
