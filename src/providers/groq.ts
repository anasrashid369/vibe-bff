import type { LlmProvider, CandidateMovie } from "./failover.js";
import type { RecommendationRequest } from "../schemas/recommendation.schema.js";
import { buildRecommendationPrompt } from "../prompts/recommendations.prompt.js";
import { getProviderSecrets } from "../services/secrets.js";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function getApiKey(): Promise<string> {
  const secrets = await getProviderSecrets();
  return secrets.groqApiKey;
}

/** Strips accidental ```json fences models sometimes add despite instructions. */
function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

/**
 * Phase 2 fallback provider -- free tier, OpenAI-compatible API. Tried
 * only if Gemini fails (see failover.ts).
 */
export const groqProvider: LlmProvider = {
  name: GROQ_MODEL,
  async call(request: RecommendationRequest, candidates: CandidateMovie[]): Promise<unknown> {
    const prompt = buildRecommendationPrompt(request, candidates);
    const apiKey = await getApiKey();

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${response.statusText} -- ${errorBody}`);
    }

    const data = (await response.json()) as GroqResponse;
    const rawText = data.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Groq response had no text content");
    }

    const modelOutput = JSON.parse(stripCodeFences(rawText)) as { recommendations?: unknown };

    return {
      source: "ai",
      provider_used: GROQ_MODEL,
      recommendations: modelOutput.recommendations,
      fallback_triggered: false,
      generated_at: new Date().toISOString(),
    };
  },
};
