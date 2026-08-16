import type { APIGatewayProxyHandler } from "aws-lambda";
import { getMetricsSnapshot } from "../services/metrics.js";

/**
 * GET /v1/metrics -- fallback rate, avg latency, total request volume.
 * The spec's "measure what matters" observability requirement (§6.5),
 * backed by DynamoDB counters instead of a full metrics pipeline.
 */
export const handler: APIGatewayProxyHandler = async () => {
  try {
    const snapshot = await getMetricsSnapshot();
    return { statusCode: 200, body: JSON.stringify(snapshot) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
