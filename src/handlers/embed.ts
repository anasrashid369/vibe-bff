import type { APIGatewayProxyHandler } from "aws-lambda";
import { EmbedRequestSchema } from "../schemas/embed.schema.js";
import { embedTexts, EMBEDDING_MODEL_VERSION } from "../services/embeddings.js";

export const handler: APIGatewayProxyHandler = async (event) => {
  const parseResult = EmbedRequestSchema.safeParse(JSON.parse(event.body ?? "{}"));

  if (!parseResult.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body", details: parseResult.error.flatten() }),
    };
  }

  try {
    const embeddings = await embedTexts(parseResult.data.texts);
    return { statusCode: 200, body: JSON.stringify({ embeddings, model_version: EMBEDDING_MODEL_VERSION }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
