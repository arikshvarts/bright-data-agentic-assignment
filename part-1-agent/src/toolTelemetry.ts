import type { ToolCall, ToolClient, ToolTelemetry } from "./types.js";

export type TrackedToolClient = ToolClient & {
  telemetry: ToolTelemetry[];
};

export function trackToolClient(client: ToolClient): TrackedToolClient {
  const telemetry: ToolTelemetry[] = [];

  return {
    telemetry,
    async callTool<T = unknown>(call: ToolCall): Promise<T> {
      const startedAt = Date.now();
      try {
        const result = await client.callTool<T>(call);
        telemetry.push({
          name: call.name,
          status: "ok",
          durationMs: Date.now() - startedAt,
          resultCount: estimateResultCount(result)
        });
        return result;
      } catch (error) {
        telemetry.push({
          name: call.name,
          status: "failed",
          durationMs: Date.now() - startedAt,
          resultCount: 0,
          error: sanitizeError(error)
        });
        throw error;
      }
    },
    async close(): Promise<void> {
      await client.close();
    }
  };
}

export function successfulToolNames(telemetry: ToolTelemetry[]): string[] {
  return [...new Set(telemetry.filter((entry) => entry.status === "ok").map((entry) => entry.name))];
}

export function toolFailureNotes(telemetry: ToolTelemetry[]): string[] {
  return telemetry
    .filter((entry) => entry.status === "failed")
    .map((entry) => `${entry.name} failed after ${entry.durationMs}ms: ${entry.error ?? "unknown error"}`);
}

function estimateResultCount(value: unknown): number {
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) return parsed.length;
  if (typeof parsed !== "object" || parsed === null) return typeof parsed === "string" && parsed.trim() ? 1 : 0;

  const record = parsed as Record<string, unknown>;
  for (const key of ["organic", "results", "items", "data", "result"]) {
    if (Array.isArray(record[key])) return record[key].length;
  }
  return Object.keys(record).length ? 1 : 0;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function sanitizeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/API_TOKEN=[^&\s]+/g, "API_TOKEN=[redacted]")
    .replace(/(ANTHROPIC_API_KEY|OPENAI_API_KEY|BRIGHT_DATA_API_TOKEN)=\S+/g, "$1=[redacted]")
    .slice(0, 500);
}
