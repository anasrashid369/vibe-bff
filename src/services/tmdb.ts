import type { CandidateMovie } from "../providers/failover.js";

export interface TmdbFilters {
  genre?: string;
  actor?: string;
  releaseDateGte?: string;
}

/**
 * Fetches candidate movies from TMDB's discover/similar endpoints. This
 * is the grounding layer — the LLM only ever reasons over what this
 * function returns, so a hallucinated movie is structurally impossible.
 */
export async function fetchCandidates(
  excludeIds: number[],
  filters: TmdbFilters,
): Promise<CandidateMovie[]> {
  // TODO: call TMDB discover/similar with `filters`, using the key
  // fetched at cold start from Secrets Manager, filtering out excludeIds.
  void excludeIds;
  void filters;
  throw new Error("Not implemented");
}
