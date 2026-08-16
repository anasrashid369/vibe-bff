import "dotenv/config";
import { claudeProvider } from "../src/providers/claude.js";

async function main() {
  const fakeRequest = {
    taste_profile_summary: "Prefers slow-burn dramas and tense thrillers.",
    top_genres: ["Thriller"],
    recent_likes: [],
    exclude_ids: [],
  };
  const fakeCandidates = [
    { id: 1, title: "Test Movie One", overview: "A tense thriller about testing.", posterPath: null, genres: ["Thriller"] },
    { id: 2, title: "Test Movie Two", overview: "A slow-burn drama about debugging.", posterPath: null, genres: ["Drama"] },
  ];

  console.log("Calling Claude directly...\n");
  const raw = await claudeProvider.call(fakeRequest, fakeCandidates);
  console.log("Raw result:");
  console.log(JSON.stringify(raw, null, 2));
}

main().catch((err) => {
  console.error("FULL ERROR:");
  console.error(err);
});