import { describe, expect, it } from "vitest";
import { repairText } from "../src/textRepair.js";

describe("repairText", () => {
  it("preserves valid multilingual and accented text", () => {
    expect(repairText("Café בתל אביב ☕")).toBe("Café בתל אביב ☕");
  });

  it("removes unsafe control and replacement characters", () => {
    expect(repairText("clean\u0000 text \uFFFD")).toBe("clean text");
  });
});
