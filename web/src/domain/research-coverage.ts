export const researchSourceGroups = [
  "primary",
  "news_search",
  "x",
  "linkedin",
  "youtube",
  "instagram",
  "reddit",
  "specialist",
] as const;

export type ResearchSourceGroup = (typeof researchSourceGroups)[number];
export type CoverageStatus = "checked" | "inaccessible" | "not_relevant";

export type ResearchCoverageEntry = {
  group: ResearchSourceGroup;
  status: CoverageStatus;
  references: string[];
  note?: string;
};

export function assessResearchCoverage(entries: ResearchCoverageEntry[]): {
  complete: boolean;
  gaps: string[];
} {
  const byGroup = new Map(entries.map((entry) => [entry.group, entry]));
  const gaps = researchSourceGroups.flatMap((group) => {
    const entry = byGroup.get(group);
    if (!entry) return [`${group}: not checked`];
    if (entry.status === "inaccessible") return [`${group}: inaccessible`];
    if (entry.status === "checked" && entry.references.length === 0) {
      return [`${group}: no references recorded`];
    }
    return [];
  });
  return { complete: gaps.length === 0, gaps };
}
