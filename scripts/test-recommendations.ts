import "dotenv/config";
import { fetchCandidates } from "../src/services/tmdb.js";
import { geminiProvider } from "../src/providers/gemini.js";
import { getRecommendationsWithFailover } from "../src/providers/failover.js";

async function main() {
  console.log("1. Fetching real TMDB candidates (Thriller)...");
  const candidates = await fetchCandidates([], { genre: "Thriller" });
  console.log(`   Got ${candidates.length} candidates.\n`);

  console.log("2. Asking Gemini to rank/explain a subset, with fallback safety net...");
  const result = await getRecommendationsWithFailover({
    request: {
      taste_profile_summary: "Prefers slow-burn dramas and tense thrillers.",
      top_genres: ["Thriller"],
      recent_likes: [],
      exclude_ids: [],
    },
    candidates: candidates.slice(0, 10), // keep the prompt small for this test
    primary: geminiProvider,
    telemetry: { increment: (m) => console.log(`   [telemetry] ${m}`) },
  });

  console.log(`\n3. Result — source: ${result.source}, provider: ${result.provider_used}`);
  console.table(result.recommendations);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});