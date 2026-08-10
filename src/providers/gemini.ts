import type { LlmProvider, CandidateMovie } from "./failover.js";
import type { RecommendationRequest } from "../schemas/recommendation.schema.js";
import { buildRecommendationPrompt } from "../prompts/recommendations.prompt.js";
import { getProviderSecrets } from "../services/secrets.js";

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

async function getApiKey(): Promise<string> {
  const secrets = await getProviderSecrets();
  return secrets.geminiApiKey;
}

/** Strips accidental ```json fences models sometimes add despite instructions. */
function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

/** Primary MVP provider (spec: Gemini 2.5 Flash). */
export const geminiProvider: LlmProvider = {
  name: GEMINI_MODEL,
  async call(request: RecommendationRequest, candidates: CandidateMovie[]): Promise<unknown> {
    const prompt = buildRecommendationPrompt(request, candidates);

    const response = await fetch(`${GEMINI_URL}?key=${await getApiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          // Ask Gemini to constrain output to valid JSON directly —
          // reduces (but doesn't eliminate) the chance of stray prose
          // or markdown fences around the response.
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini response had no text content");
    }

    const modelOutput = JSON.parse(stripCodeFences(rawText)) as { recommendations?: unknown };

    // The model is only responsible for `recommendations` — we attach
    // the metadata fields ourselves rather than letting the LLM decide
    // its own provider name or timestamp. failover.ts validates the
    // full shape returned here against RecommendationResponseSchema.
    return {
      source: "ai",
      provider_used: GEMINI_MODEL,
      recommendations: modelOutput.recommendations,
      fallback_triggered: false,
      generated_at: new Date().toISOString(),
    };
  },
};