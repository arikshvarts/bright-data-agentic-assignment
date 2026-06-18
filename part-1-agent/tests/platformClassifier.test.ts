import { describe, expect, it } from "vitest";
import { classifyPlatform } from "../src/platformClassifier.js";

describe("classifyPlatform", () => {
  it("classifies social and trend-source URLs", () => {
    expect(classifyPlatform("https://www.tiktok.com/@creator/video/123")).toBe("tiktok");
    expect(classifyPlatform("https://www.youtube.com/shorts/abc")).toBe("youtube");
    expect(classifyPlatform("https://www.reddit.com/r/TelAviv/comments/abc")).toBe("reddit");
    expect(classifyPlatform("https://ads.tiktok.com/creative/creativeCenter/trends")).toBe("creative_center");
    expect(classifyPlatform("https://www.vogue.com/article/the-vogue-business-tiktok-trend-tracker")).toBe("trend_intel");
  });
});
