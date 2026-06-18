import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ToolCall, ToolClient } from "./types.js";

export async function createBrightDataClient(): Promise<ToolClient> {
  const token = process.env.BRIGHT_DATA_API_TOKEN;
  if (!token) {
    throw new Error("Missing BRIGHT_DATA_API_TOKEN. Copy .env.example to .env and add your Bright Data token.");
  }

  const client = new Client({
    name: "trend-to-video-agent",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@brightdata/mcp"],
    env: {
      ...process.env,
      API_TOKEN: token,
      GROUPS: process.env.BRIGHT_DATA_MCP_GROUPS || process.env.GROUPS || "social",
      BASE_TIMEOUT: process.env.BASE_TIMEOUT || "120",
      BASE_MAX_RETRIES: process.env.BASE_MAX_RETRIES || "1"
    }
  });

  const timeout = Number.parseInt(process.env.MCP_REQUEST_TIMEOUT_MS || "180000", 10);
  await client.connect(transport, {
    timeout,
    resetTimeoutOnProgress: true
  });

  return {
    async callTool<T = unknown>(call: ToolCall): Promise<T> {
      const result = await client.callTool(
        {
          name: call.name,
          arguments: call.args
        },
        undefined,
        {
          timeout,
          resetTimeoutOnProgress: true
        }
      );
      const errorResult = result as { isError?: boolean; content?: Array<{ type: string; text?: string }> };
      if (errorResult.isError) {
        const message = errorResult.content
          ?.map((part) => (part.type === "text" ? part.text ?? "" : ""))
          .filter(Boolean)
          .join("\n");
        throw new Error(message || `Bright Data MCP tool ${call.name} returned an error.`);
      }
      return unwrapToolResult(result) as T;
    },
    async close(): Promise<void> {
      await client.close();
    }
  };
}

function unwrapToolResult(result: unknown): unknown {
  const record = result as { content?: Array<{ type: string; text?: string }>; structuredContent?: unknown };
  if (record.structuredContent) return record.structuredContent;
  if (Array.isArray(record.content)) {
    return record.content
      .map((part) => (part.type === "text" ? part.text ?? "" : ""))
      .filter(Boolean)
      .join("\n");
  }
  return result;
}
