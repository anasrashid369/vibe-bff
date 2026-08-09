import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

/** Liveness + upstream provider status, used by the telemetry dashboard. */
export const handler: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      // TODO: ping TMDB / LLM provider health once those clients exist.
    }),
  };
};
