import { canApproveIdea, type Channel } from "@/domain/content-system";
import { assessResearchCoverage, type ResearchCoverageEntry } from "@/domain/research-coverage";

export type ApprovalValidationInput = {
  channel: Channel;
  g9Passed: boolean;
  coverage: ResearchCoverageEntry[];
  productLed: boolean;
  productModule?: string | null;
  productTruth?: {
    found: boolean;
    status?: string;
    safeWording?: string;
    evidenceSource?: string;
    lastVerified?: string;
    limitation?: string;
    conflict?: string;
  };
};

const blockedProductStatuses = new Set([
  "planned or proposed",
  "demonstrated in development",
  "blocked or unknown",
]);

export function validateApproval(input: ApprovalValidationInput): {
  passed: boolean;
  reasons: string[];
  approvedSafeWording?: string;
  limitations: string[];
} {
  const reasons: string[] = [];
  const limitations: string[] = [];
  const channelDecision = canApproveIdea(input);
  if (!channelDecision.allowed) reasons.push(channelDecision.reason || "Channel approval is blocked.");

  const coverage = assessResearchCoverage(input.coverage);
  if (!coverage.complete) reasons.push(`Research coverage is incomplete: ${coverage.gaps.join(", ")}.`);

  let approvedSafeWording: string | undefined;
  if (input.productLed) {
    if (!input.productModule) reasons.push("A Product Truth module must be selected for product-led content.");
    if (!input.productTruth?.found) reasons.push("The matching Product Truth capability row was not found.");
    const status = input.productTruth?.status?.trim().toLowerCase();
    if (status && blockedProductStatuses.has(status)) reasons.push(`Product Truth status is ${input.productTruth?.status}; it cannot be presented as verified-live.`);
    if (!input.productTruth?.safeWording) reasons.push("Product Truth safe wording is missing.");
    if (!input.productTruth?.evidenceSource) reasons.push("Product Truth evidence source is missing.");
    if (!input.productTruth?.lastVerified) reasons.push("Product Truth last-verified date is missing.");
    if (input.productTruth?.conflict) reasons.push(`Product Truth conflict requires human review: ${input.productTruth.conflict}`);
    approvedSafeWording = input.productTruth?.safeWording;
    if (input.productTruth?.limitation) limitations.push(input.productTruth.limitation);
  }

  return { passed: reasons.length === 0, reasons, approvedSafeWording, limitations };
}
