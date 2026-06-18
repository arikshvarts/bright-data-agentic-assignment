import { describe, expect, it } from "vitest";
import { defaultProfile } from "../src/profile.js";
import { planTrendQueries } from "../src/queryPlanner.js";

describe("planTrendQueries", () => {
  it("creates TikTok-first, location-aware trend queries", () => {
    const queries = planTrendQueries({
      profile: defaultProfile(),
      region: "il",
      maxSources: 6,
      maxTrends: 4
    });

    expect(queries.length).toBeGreaterThanOrEqual(5);
    expect(queries.join(" ")).toContain("TikTok");
    expect(queries.join(" ")).toContain("Tel Aviv");
    expect(queries.join(" ")).toContain("specialty coffee");
    expect(queries.join(" ")).toContain("English");
    expect(queries.join(" ")).toContain("site:reddit.com");
  });
});
