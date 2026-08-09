import { z } from "zod";

/**
 * Strict schema the LLM's raw JSON output must conform to before it is
 * ever returned to the client. If validation fails, the BFF retries once
 * with a stricter instruction, then falls back (see providers/failover.ts).
 */
export const RecommendationItemSchema = z.object({
  movie_id: z.number().int().positive(),
  title: z.string().min(1),
  reason: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
});

export const RecommendationResponseSchema = z.object({
  source: z.enum(["ai", "fallback"]),
  provider_used: z.string().nullable(),
  recommendations: z.array(RecommendationItemSchema).min(1),
  fallback_triggered: z.boolean(),
  generated_at: z.string().datetime(),
});

export type RecommendationItem = z.infer<typeof RecommendationItemSchema>;
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;

export const RecommendationRequestSchema = z.object({
  taste_profile_summary: z.string().min(1),
  top_genres: z.array(z.string()).default([]),
  recent_likes: z.array(z.number().int()).default([]),
  exclude_ids: z.array(z.number().int()).default([]),
});

export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;
