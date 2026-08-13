export type TrackerStatus = "Approved Topic" | "Drafting" | "Review" | "Ready" | "Published";

export function sheetRowForContent(input: {
  topic: string;
  approach: string;
  category: string;
  format: string;
  status: TrackerStatus;
  contentDocUrl: string;
}): [string, string, string, string, TrackerStatus, string] {
  return [input.topic, input.approach, input.category, input.format, input.status, input.contentDocUrl];
}

export function buildProductionDocument(input: {
  topic: string;
  finalCopyOrScript: string;
  onScreenText: string;
  visualInstructions: string;
  narration: "Human" | "Not Applicable";
  cta: string;
  sources: string[];
  limitations: string[];
}): string {
  const sections = [
    input.topic,
    "",
    "FINAL COPY OR SCRIPT",
    input.finalCopyOrScript,
    "",
    "ON-SCREEN OR SLIDE TEXT",
    input.onScreenText,
    "",
    "VISUAL OR SHOT INSTRUCTIONS",
    input.visualInstructions,
    "",
    "NARRATION",
    input.narration,
    "",
    "CTA",
    input.cta,
    "",
    "SOURCES",
    ...input.sources,
  ];
  if (input.limitations.length) sections.push("", "REQUIRED LIMITATIONS", ...input.limitations);
  return sections.join("\n");
}
