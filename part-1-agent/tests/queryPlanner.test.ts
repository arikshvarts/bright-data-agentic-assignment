import { describe, expect, it } from "vitest";
import { planQueries } from "../src/queryPlanner.js";

describe("planQueries", () => {
  it("creates focused integration-decision queries around the company and region", () => {
    const queries = planQueries({
      company: "Bright Data",
      decision: "next coding-agent integration",
      region: "us",
      maxSources: 8
    });

    expect(queries).toHaveLength(5);
    expect(queries[0]).toContain("Bright Data");
    expect(queries[0]).toContain("Codex");
    expect(queries[0]).toContain("us");
  });
});
