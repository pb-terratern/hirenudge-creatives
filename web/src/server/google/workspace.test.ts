import { describe, expect, it } from "vitest";

import { buildProductionDocument, sheetRowForContent } from "@/server/google/workspace";

describe("Google Workspace payloads", () => {
  it("maps a content item to the exact six-column tracker contract", () => {
    expect(sheetRowForContent({
      topic: "Remote-ready proof",
      approach: "Show four evidence types",
      category: "Global applications",
      format: "Reel",
      status: "Drafting",
      contentDocUrl: "https://docs.google.com/document/d/doc-1/edit",
    })).toEqual(["Remote-ready proof", "Show four evidence types", "Global applications", "Reel", "Drafting", "https://docs.google.com/document/d/doc-1/edit"]);
  });

  it("writes only production material and sources to the final document", () => {
    const body = buildProductionDocument({
      topic: "Remote-ready proof",
      finalCopyOrScript: "Prepare evidence before using the remote filter.",
      onScreenText: "Four kinds of proof",
      visualInstructions: "Human presenter with four restrained text cards.",
      narration: "Human",
      cta: "Build your proof bank before your next application.",
      sources: ["https://example.org/remote-guide"],
      limitations: ["Orientation only; employer requirements vary."],
    });

    expect(body).toContain("FINAL COPY OR SCRIPT");
    expect(body).toContain("Orientation only; employer requirements vary.");
    expect(body).not.toContain("model reasoning");
    expect(body).not.toContain("gate log");
  });
});
