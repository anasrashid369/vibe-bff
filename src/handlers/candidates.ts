import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { fetchCandidates } from "../services/tmdb.js";

/** Thin TMDB proxy — discover/similar, with query params for filters. */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const qs = event.queryStringParameters ?? {};

  try {
    const candidates = await fetchCandidates([], {
      genre: qs.genre,
      actor: qs.actor,
      releaseDateGte: qs.release_date_gte,
    });
    return { statusCode: 200, body: JSON.stringify({ candidates }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
