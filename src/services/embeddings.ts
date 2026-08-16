import { getProviderSecrets } from "./secrets.js";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

interface EmbedContentResponse {
  embedding?: { values: number[] };
}

async function getApiKey(): Promise<string> {
  const secrets = await getProviderSecrets();
  return secrets.geminiApiKey;
}

async function embedOne(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(`${EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed: ${response.status} ${response.statusText} -- ${body}`);
  }

  const data = (await response.json()) as EmbedContentResponse;
  if (!data.embedding?.values) {
    throw new Error("Embedding response had no values");
  }
  return data.embedding.values;
}

/**
 * Embeds a batch of texts using Gemini's embedding model. Note: this
 * model only supports the singular embedContent method (no
 * batchEmbedContents), so we call it once per text in parallel rather
 * than a single batch request.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = await getApiKey();
  return Promise.all(texts.map((text) => embedOne(text, apiKey)));
}

export const EMBEDDING_MODEL_VERSION = EMBEDDING_MODEL;