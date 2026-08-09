import type { CandidateMovie } from "../providers/failover.js";
import type { RecommendationRequest } from "../schemas/recommendation.schema.js";

export const RECOMMENDATIONS_PROMPT_VERSION = "v1";

/**
 * The LLM never invents a movie — it only ranks, filters, and explains
 * candidates fetched from TMDB. Centralizing the template here means it
 * can change without a client release (spec §3.1, §5.1).
 */
export function buildRecommendationPrompt(
  request: RecommendationRequest,
  candidates: CandidateMovie[],
): string {
  const candidateList = candidates
    .map((c) => `- id=${c.id} title="${c.title}" overview="${c.overview}"`)
    .join("\n");

  return `You are ranking movie candidates for a user based on their taste profile.
You must ONLY select from the candidate list below — never invent a movie.

Taste profile: ${request.taste_profile_summary}
Top genres: ${request.top_genres.join(", ") || "none yet"}

Candidates:
${candidateList}

Return JSON matching this exact shape (no prose, no markdown fences):
{
  "recommendations": [
    { "movie_id": number, "title": string, "reason": string, "confidence": "high" | "medium" | "low" }
  ]
}`;
}
