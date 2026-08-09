import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

/**
 * Phase 2. Body: { query_text } -> embedding generated server-side,
 * returned to the client for local vector search (spec §5.2).
 */
export const handler: APIGatewayProxyHandlerV2 = async () => {
  return { statusCode: 501, body: JSON.stringify({ error: "Not implemented — Phase 2" }) };
};
