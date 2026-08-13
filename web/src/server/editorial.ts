import type { z } from "zod";
import type { productionPacketSchema } from "@/server/agents/schemas";

type Packet = z.infer<typeof productionPacketSchema>;

const blockedPatterns = [
  /guarantee(?:d|s)? (?:an? )?(?:job|interview|offer|outcome)/i,
  /beat the ats/i,
  /ats[- ]proof/i,
  /recruiters (?:always|never)/i,
  /apply now before it'?s too late/i,
];

export function reviewProductionPacket(packet: Packet): { g6: string[]; g7: string[]; passed: boolean } {
  const g6: string[] = [];
  const g7: string[] = [];
  if (!packet.finalCopyOrScript.trim()) g6.push("Final copy or script is missing.");
  if (!packet.cta.trim()) g6.push("A single CTA is required.");
  if (!packet.sourceLinks.length) g6.push("At least one source is required.");
  if (packet.narration !== "Human" && packet.narration !== "Not Applicable") g6.push("Narration must be human or not applicable.");
  const fullText = `${packet.finalCopyOrScript}\n${packet.onScreenOrSlideText}\n${packet.cta}`;
  for (const pattern of blockedPatterns) if (pattern.test(fullText)) g7.push(`Unsupported or low-trust wording matched ${pattern}.`);
  if (/everyone|anyone|all applicants/i.test(fullText)) g7.push("Universal applicant claims require narrowing and evidence.");
  return { g6, g7, passed: g6.length === 0 && g7.length === 0 };
}
