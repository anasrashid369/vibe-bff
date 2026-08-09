import type { LlmProvider, CandidateMovie } from "./failover.js";
import type { RecommendationRequest } from "../schemas/recommendation.schema.js";
import { buildRecommendationPrompt } from "../prompts/recommendations.prompt.js";

/** Phase 2 fallback provider (spec: Claude 3.5 Haiku). */
export const claudeProvider: LlmProvider = {
  name: "claude-3.5-haiku",
  async call(request: RecommendationRequest, candidates: CandidateMovie[]): Promise<unknown> {
    const prompt = buildRecommendationPrompt(request, candidates);
    // TODO: call Anthropic API with `prompt`. Not wired into the MVP —
    // Phase 2 adds this to getRecommendationsWithFailover's `fallback` param.
    void prompt;
    throw new Error("Not implemented");
  },
};
