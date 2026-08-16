import { describe, it, expect, vi } from "vitest";
import { getRecommendationsWithFailover } from "../src/providers/failover.js";
import type { LlmProvider, CandidateMovie } from "../src/providers/failover.js";
import { claudeProvider } from "../src/providers/claude.js";

const candidates: CandidateMovie[] = [
  { id: 1, title: "Parasite", overview: "A tense social thriller.", posterPath: null, genres: ["Drama", "Thriller"] },
];

const validResponse = {
  source: "ai",
  provider_used: "test-provider",
  recommendations: [
    { movie_id: 1, title: "Parasite", reason: "Matches your taste for tense dramas.", confidence: "high" },
  ],
  fallback_triggered: false,
  generated_at: new Date().toISOString(),
};

function makeProvider(name: string, impl: () => Promise<unknown>): LlmProvider {
  return { name, call: vi.fn(impl) };
}

describe("getRecommendationsWithFailover", () => {
  it("returns the primary provider's response when it succeeds and validates", async () => {
    const primary = makeProvider("primary", async () => validResponse);
    const result = await getRecommendationsWithFailover({
      request: { taste_profile_summary: "likes thrillers", top_genres: [], recent_likes: [], exclude_ids: [] },
      candidates,
      primary,
      telemetry: { increment: vi.fn() },
    });
    expect(result.source).toBe("ai");
    expect(result.provider_used).toBe("primary");
  });

  it("falls back to TMDB-only ranking when primary throws and no fallback provider is configured", async () => {
    const primary = makeProvider("primary", async () => {
      throw new Error("boom");
    });
    const result = await getRecommendationsWithFailover({
      request: { taste_profile_summary: "likes thrillers", top_genres: [], recent_likes: [], exclude_ids: [] },
      candidates,
      primary,
      telemetry: { increment: vi.fn() },
    });
    expect(result.source).toBe("fallback");
    expect(result.fallback_triggered).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("falls back to TMDB-only ranking when primary returns malformed JSON", async () => {
    const primary = makeProvider("primary", async () => ({ nonsense: true }));
    const result = await getRecommendationsWithFailover({
      request: { taste_profile_summary: "likes thrillers", top_genres: [], recent_likes: [], exclude_ids: [] },
      candidates,
      primary,
      telemetry: { increment: vi.fn() },
    });
    expect(result.source).toBe("fallback");
  });

  it("uses the secondary provider when primary fails but fallback succeeds", async () => {
    const primary = makeProvider("primary", async () => {
      throw new Error("boom");
    });
    const fallback = makeProvider("fallback", async () => validResponse);
    const result = await getRecommendationsWithFailover({
      request: { taste_profile_summary: "likes thrillers", top_genres: [], recent_likes: [], exclude_ids: [] },
      candidates,
      primary,
      fallback,
      telemetry: { increment: vi.fn() },
    });
    expect(result.source).toBe("ai");
    expect(result.provider_used).toBe("fallback");
  });
});

describe("claudeProvider wiring", () => {
  it("is exported with the expected shape", () => {
    expect(claudeProvider.name).toBe("claude-3-5-haiku-latest");
    expect(typeof claudeProvider.call).toBe("function");
  });
});
