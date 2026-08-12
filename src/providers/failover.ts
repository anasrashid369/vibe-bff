import type { RecommendationRequest, RecommendationResponse } from "../schemas/recommendation.schema.js";
import { RecommendationResponseSchema } from "../schemas/recommendation.schema.js";

export interface CandidateMovie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
}

export interface LlmProvider {
  name: string;
  /** Calls the provider and returns raw (unvalidated) JSON. */
  call(request: RecommendationRequest, candidates: CandidateMovie[]): Promise<unknown>;
}

export interface Telemetry {
  increment(metric: string): void;
}

/**
 * MVP ships with a single provider + non-AI fallback (spec §7.1/§7.2).
 * Phase 2 adds a second provider here — the branching structure below
 * already anticipates it (see spec §5.4).
 */
export async function getRecommendationsWithFailover(params: {
  request: RecommendationRequest;
  candidates: CandidateMovie[];
  primary: LlmProvider;
  fallback?: LlmProvider; // Phase 2
  telemetry: Telemetry;
}): Promise<RecommendationResponse> {
  const { request, candidates, primary, fallback, telemetry } = params;

  try {
    const raw = await primary.call(request, candidates);
    const parsed = RecommendationResponseSchema.parse(raw);
    return { ...parsed, source: "ai", provider_used: primary.name };
  } catch {
    telemetry.increment("llm.primary.failure");
  }

  if (fallback) {
    try {
      const raw = await fallback.call(request, candidates);
      const parsed = RecommendationResponseSchema.parse(raw);
      return { ...parsed, source: "ai", provider_used: fallback.name };
    } catch {
      telemetry.increment("llm.fallback.failure");
    }
  }

  return tmdbOnlyRanking(candidates);
}

/** Non-AI fallback: always returns *something* valid. */
function tmdbOnlyRanking(candidates: CandidateMovie[]): RecommendationResponse {
  return {
    source: "fallback",
    provider_used: null,
    recommendations: candidates.slice(0, 10).map((c) => ({
      movie_id: c.id,
      title: c.title,
      reason: "Popular pick based on your recent activity.",
      confidence: "low" as const,
      poster_path: c.posterPath,
    })),
    fallback_triggered: true,
    generated_at: new Date().toISOString(),
  };
}
