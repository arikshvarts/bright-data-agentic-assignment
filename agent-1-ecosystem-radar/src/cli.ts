import "dotenv/config";
import { Command } from "commander";
import { createBrightDataClient } from "./mcpBrightData.js";
import { persistReport, runRadarAgent } from "./agent.js";
import { renderConsoleSummary } from "./reportRenderer.js";
import type { AgentOptions } from "./types.js";

const program = new Command()
  .name("agent-ecosystem-opportunity-radar")
  .description("Rank coding-agent ecosystem integration opportunities with Bright Data MCP.")
  .option("--company <company>", "Company making the product/integration decision", "Bright Data")
  .option("--decision <decision>", "Decision to evaluate", "next coding-agent integration")
  .option("--market <market>", "Deprecated alias used to seed a decision about a broad market")
  .option("--region <region>", "Two-letter search region", process.env.REGION || "us")
  .option("--max-sources <number>", "Maximum evidence sources to scrape", process.env.MAX_SOURCES || "8")
  .parse(process.argv);

const parsed = program.opts<{ company: string; decision: string; market?: string; region: string; maxSources: string }>();
const options: AgentOptions = {
  company: parsed.company,
  decision: parsed.market ? `next integration opportunity for ${parsed.market}` : parsed.decision,
  region: parsed.region.toLowerCase(),
  maxSources: Number.parseInt(parsed.maxSources, 10)
};

if (!Number.isInteger(options.maxSources) || options.maxSources < 3 || options.maxSources > 20) {
  console.error("--max-sources must be an integer between 3 and 20.");
  process.exit(1);
}

const client = await createBrightDataClient();

try {
  const report = await runRadarAgent(options, client);
  const paths = await persistReport(report);
  console.log(renderConsoleSummary(report));
  console.log(`Markdown report: ${paths.markdownPath}`);
  console.log(`JSON report: ${paths.jsonPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.close();
}
