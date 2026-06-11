import { describe, expect, it } from "vitest";
import { dedupeSources, normalizeToolResult } from "../src/sourceNormalizer.js";

describe("sourceNormalizer", () => {
  it("normalizes nested search results and removes duplicate URLs", () => {
    const raw = JSON.stringify({
      organic: [
        { url: "https://example.com/a?b=1", title: "A", description: "First" },
        { url: "https://example.com/a?b=1", title: "A duplicate", description: "Duplicate" },
        { link: "https://example.com/b", title: "B", snippet: "Second" }
      ]
    });

    const normalized = normalizeToolResult(raw, "search");
    const deduped = dedupeSources(normalized, 8);

    expect(normalized).toHaveLength(3);
    expect(deduped).toHaveLength(2);
    expect(deduped[0]?.scrapeStatus).toBe("not_attempted");
  });
});

