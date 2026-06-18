import { describe, expect, it } from "vitest";
import { loadCreatorProfile } from "../src/profile.js";

describe("loadCreatorProfile", () => {
  it("merges CLI inputs over the default profile", async () => {
    const profile = await loadCreatorProfile({
      businessName: "Arik Coffee",
      niche: "coffee and study cafe",
      location: "Jerusalem, Israel"
    });

    expect(profile.businessName).toBe("Arik Coffee");
    expect(profile.niche).toBe("coffee and study cafe");
    expect(profile.location).toBe("Jerusalem, Israel");
    expect(profile.capabilities.length).toBeGreaterThan(0);
  });
});
