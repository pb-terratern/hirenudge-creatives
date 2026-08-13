import { describe, expect, it } from "vitest";
import { reviewProductionPacket } from "@/server/editorial";

const packet = { finalCopyOrScript: "Prepare proof that helps a reader assess how you work.", onScreenOrSlideText: "Show the proof", visualOrShotInstructions: "Human presenter", narration: "Human" as const, cta: "Save this check", sourceLinks: ["https://example.com"] };

describe("production and editorial gates", () => {
  it("passes a complete, bounded packet", () => expect(reviewProductionPacket(packet).passed).toBe(true));
  it("blocks ATS guarantees", () => expect(reviewProductionPacket({ ...packet, finalCopyOrScript: "This guarantees an interview and will beat the ATS." }).g7.length).toBeGreaterThan(0));
});
