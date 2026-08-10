import "dotenv/config";
import { fetchCandidates } from "../src/services/tmdb.js";

async function main() {
  console.log("Fetching Drama candidates from TMDB...");
  const candidates = await fetchCandidates([], { genre: "Drama" });
  console.log(`Got ${candidates.length} candidates. First 5:`);
  console.table(candidates.slice(0, 5));
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});