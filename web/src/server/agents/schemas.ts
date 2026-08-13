import { z } from "zod";

import { channels } from "@/domain/content-system";
import { researchSourceGroups } from "@/domain/research-coverage";

export const sourceCoverageSchema = z.object({
  group: z.enum(researchSourceGroups),
  status: z.enum(["checked", "inaccessible", "not_relevant"]),
  references: z.array(z.url()),
  note: z.string().optional(),
});

export const candidateSchema = z.object({
  channel: z.enum(channels),
  topic: z.string().min(12).max(180),
  approach: z.string().min(24).max(500),
  category: z.string().min(3).max(80),
  format: z.string().min(2).max(80),
  whyNow: z.string().min(20).max(500),
  evidenceSummary: z.string().min(20).max(800),
  conceptKey: z.string().min(8).max(200),
  hookKey: z.string().min(8).max(200),
  productLed: z.boolean(),
  productModule: z.string().min(2).max(120).nullable(),
  riskOrLimitation: z.string().min(4).max(500),
  score: z.number().int().min(0).max(100),
  eligible: z.boolean(),
  researchCoverage: z.array(sourceCoverageSchema),
});

export const ideationResponseSchema = z.object({ candidates: z.array(candidateSchema).length(6) });
export type IdeationCandidate = z.infer<typeof candidateSchema>;

export const productionPacketSchema = z.object({
  finalCopyOrScript: z.string().min(20),
  onScreenOrSlideText: z.string(),
  visualOrShotInstructions: z.string(),
  narration: z.enum(["Human", "Not Applicable"]),
  cta: z.string().min(4),
  sourceLinks: z.array(z.url()).min(1),
});
