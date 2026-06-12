import type { AgentOptions } from "./types.js";

export function planQueries(options: AgentOptions): string[] {
  const company = options.company.trim();
  const decision = options.decision.trim();
  const region = options.region.trim().toLowerCase();

  return [
    `${company} ${decision} Codex Claude Code Cursor Copilot MCP integration developer pain ${region}`,
    `${company} MCP server Codex Claude Code Cursor Copilot integration docs GitHub ${region}`,
    `Bright Data Firecrawl Apify agent MCP Codex Claude Code Cursor integration comparison ${region}`,
    `developers struggling MCP web access coding agents Codex Claude Code Cursor Copilot ${region}`,
    `official docs Codex Claude Code Cursor Copilot MCP tools integration agent framework ${region}`
  ];
}
