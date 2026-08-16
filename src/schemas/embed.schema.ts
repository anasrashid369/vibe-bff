import { z } from "zod";

export const EmbedRequestSchema = z.object({
  texts: z.array(z.string().min(1)).min(1).max(50),
});
export type EmbedRequest = z.infer<typeof EmbedRequestSchema>;

export const VibeSearchRequestSchema = z.object({
  query_text: z.string().min(1),
});
export type VibeSearchRequest = z.infer<typeof VibeSearchRequestSchema>;
