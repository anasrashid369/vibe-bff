import type { CandidateMovie } from "../providers/failover.js";
import { getProviderSecrets } from "./secrets.js";

export interface TmdbFilters {
  genre?: string;
  actor?: string; // not yet supported — see note below
  releaseDateGte?: string;
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// TMDB's official genre ID list for movies (stable, documented at
// https://developer.themoviedb.org/reference/genre-movie-list).
// Only common genres a taste profile is likely to mention are mapped;
// unmapped genre names are simply ignored rather than erroring out.
const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Science Fiction": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

interface TmdbMovieResult {
  id: number;
  title: string;
  overview: string;
}

interface TmdbDiscoverResponse {
  results: TmdbMovieResult[];
}

async function getReadAccessToken(): Promise<string> {
  const secrets = await getProviderSecrets();
  return secrets.tmdbApiKey;
}

/**
 * Fetches candidate movies from TMDB's discover endpoint. This is the
 * grounding layer (spec §3.1) — the LLM only ever reasons over what this
 * function returns, so a hallucinated movie is structurally impossible.
 */
export async function fetchCandidates(
  excludeIds: number[],
  filters: TmdbFilters,
): Promise<CandidateMovie[]> {
  const params = new URLSearchParams({
    sort_by: "popularity.desc",
    include_adult: "false",
  });

  const genreId = filters.genre ? GENRE_NAME_TO_ID[filters.genre] : undefined;
  if (genreId) {
    params.set("with_genres", String(genreId));
  }

  if (filters.releaseDateGte) {
    params.set("primary_release_date.gte", filters.releaseDateGte);
  }

  // TODO(Phase 2): filters.actor requires a /search/person lookup first
  // to resolve a name to a TMDB person ID, then with_cast=<id>. Skipped
  // for MVP — genre-based discovery is enough to prove the grounding
  // pipeline end to end.

  const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${await getReadAccessToken()}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as TmdbDiscoverResponse;
  const excludeSet = new Set(excludeIds);

  return data.results
    .filter((movie) => !excludeSet.has(movie.id))
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
    }));
}