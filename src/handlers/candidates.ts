import type { APIGatewayProxyHandler } from "aws-lambda";
import { fetchCandidates } from "../services/tmdb.js";

/** Thin TMDB proxy — discover/similar, with query params for filters. */
export const handler: APIGatewayProxyHandler = async (event) => {
  const qs = event.queryStringParameters ?? {};

  try {
    const candidates = await fetchCandidates([], {
      genre: qs.genre,
      actor: qs.actor,
      releaseDateGte: qs.release_date_gte,
    });

    const body = candidates.map((c) => ({
      id: c.id,
      title: c.title,
      overview: c.overview,
      poster_path: c.posterPath,
    }));

    return { statusCode: 200, body: JSON.stringify({ candidates: body }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
