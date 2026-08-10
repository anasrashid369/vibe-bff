import "dotenv/config";
import { geminiProvider } from "../src/providers/gemini.js";

async function main() {
  const fakeRequest = {
    taste_profile_summary: "Prefers slow-burn dramas and tense thrillers.",
    top_genres: ["Thriller"],
    recent_likes: [],
    exclude_ids: [],
  };
  const fakeCandidates = [
    { id: 1, title: "Test Movie One", overview: "A tense thriller about testing." },
    { id: 2, title: "Test Movie Two", overview: "A slow-burn drama about debugging." },
  ];

  console.log("Calling Gemini directly (no failover swallowing errors)...\n");
  const raw = await geminiProvider.call(fakeRequest, fakeCandidates);
  console.log("Raw result:");
  console.log(JSON.stringify(raw, null, 2));
}

main().catch((err) => {
  console.error("FULL ERROR:");
  console.error(err);
});