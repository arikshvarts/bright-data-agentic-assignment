import { describe, expect, it } from "vitest";
import { inferRegion } from "../src/region.js";

describe("inferRegion", () => {
  it("infers the search country from each profile location", () => {
    expect(inferRegion("Tel Aviv, Israel")).toBe("il");
    expect(inferRegion("New York, United States")).toBe("us");
    expect(inferRegion("London, United Kingdom")).toBe("gb");
  });
});
