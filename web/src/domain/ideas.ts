export type ScoredIdea = {
  id: string;
  score: number;
  eligible: boolean;
  conceptKey: string;
};

export function selectSurfacedIdeas<T extends ScoredIdea>(candidates: T[], target: number): T[] {
  const seen = new Set<string>();
  return [...candidates]
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => {
      if (!candidate.eligible || seen.has(candidate.conceptKey)) return false;
      seen.add(candidate.conceptKey);
      return true;
    })
    .slice(0, target);
}
