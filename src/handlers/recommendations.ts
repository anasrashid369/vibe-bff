import type { APIGatewayProxyHandler } from "aws-lambda";
import { RecommendationRequestSchema } from "../schemas/recommendation.schema.js";
import { getRecommendationsWithFailover } from "../providers/failover.js";
import { geminiProvider } from "../providers/gemini.js";
import { groqProvider } from "../providers/groq.js";
import { fetchCandidates } from "../services/tmdb.js";
import { log, telemetry } from "../lib/logger.js";
import { recordRequestMetrics } from "../services/metrics.js";

export const handler: APIGatewayProxyHandler = async (event) => {
  const start = Date.now();

  const parseResult = RecommendationRequestSchema.safeParse(
    JSON.parse(event.body ?? "{}"),
  );

  if (!parseResult.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body", details: parseResult.error.flatten() }),
    };
  }

  const request = parseResult.data;

  try {
    const candidates = await fetchCandidates(request.exclude_ids, {
      genre: request.top_genres[0],
    });

    const response = await getRecommendationsWithFailover({
      request,
      candidates,
      primary: geminiProvider,
      fallback: groqProvider,
      telemetry,
    });

    const candidateById = new Map(candidates.map((c) => [c.id, c]));
    const enrichedResponse = {
      ...response,
      recommendations: response.recommendations.map((rec) => {
        const candidate = candidateById.get(rec.movie_id);
        return {
          ...rec,
          poster_path: candidate?.posterPath ?? null,
          genres: candidate?.genres ?? [],
        };
      }),
    };

    const latencyMs = Date.now() - start;

    log({
      event: "recommendations.completed",
      provider: response.provider_used,
      fallback_triggered: response.fallback_triggered,
      latency_ms: latencyMs,
    });

    await recordRequestMetrics({ fallbackTriggered: response.fallback_triggered, latencyMs });

    return { statusCode: 200, body: JSON.stringify(enrichedResponse) };
  } catch (err) {
    log({ event: "recommendations.error", error: String(err), latency_ms: Date.now() - start });
    return { statusCode: 502, body: JSON.stringify({ error: "Upstream failure" }) };
  }
};
