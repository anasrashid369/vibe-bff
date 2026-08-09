import type { LlmProvider, CandidateMovie } from "./failover.js";
import type { RecommendationRequest } from "../schemas/recommendation.schema.js";
import { buildRecommendationPrompt } from "../prompts/recommendations.prompt.js";

/** Primary MVP provider (spec: Gemini 2.5 Flash). */
export const geminiProvider: LlmProvider = {
  name: "gemini-2.5-flash",
  async call(request: RecommendationRequest, candidates: CandidateMovie[]): Promise<unknown> {
    const prompt = buildRecommendationPrompt(request, candidates);
    // TODO: call Gemini API with `prompt`, using the key fetched at cold
    // start from Secrets Manager (see src/services/secrets.ts). Return
    // the raw parsed JSON body — validation happens in failover.ts.
    void prompt;
    throw new Error("Not implemented");
  },
};
