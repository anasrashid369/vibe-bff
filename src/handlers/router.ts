import type { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { handler as recommendationsHandler } from "./recommendations.js";
import { handler as candidatesHandler } from "./candidates.js";
import { handler as healthHandler } from "./health.js";
import { handler as vibeSearchHandler } from "./vibeSearch.js";
import { handler as embedHandler } from "./embed.js";
import { handler as metricsHandler } from "./metrics.js";

/**
 * Single Lambda sits behind API Gateway's {proxy+} catch-all (see
 * vibe-infra/modules/api_gateway) -- every path/method lands here, so
 * this router dispatches to the right handler based on path + method.
 */
async function invoke(
  fn: APIGatewayProxyHandler,
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const result = await fn(event, context, () => {
    /* unused legacy callback param */
  });
  if (!result) {
    throw new Error("Handler returned void -- all handlers must return a result");
  }
  return result;
}

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const path = event.path;
  const method = event.httpMethod;

  if (path === "/v1/health" && method === "GET") {
    return invoke(healthHandler, event, context);
  }
  if (path === "/v1/recommendations" && method === "POST") {
    return invoke(recommendationsHandler, event, context);
  }
  if (path === "/v1/movies/candidates" && method === "GET") {
    return invoke(candidatesHandler, event, context);
  }
  if (path === "/v1/search/vibe" && method === "POST") {
    return invoke(vibeSearchHandler, event, context);
  }
  if (path === "/v1/embed" && method === "POST") {
    return invoke(embedHandler, event, context);
  }
  if (path === "/v1/metrics" && method === "GET") {
    return invoke(metricsHandler, event, context);
  }

  return { statusCode: 404, body: JSON.stringify({ error: "Not found", path, method }) };
};
