import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "vibe-local-cache";

let docClient: DynamoDBDocumentClient | undefined;

function getClient(): DynamoDBDocumentClient {
  if (docClient) return docClient;

  const endpoint = process.env.AWS_ENDPOINT_URL;
  const raw = new DynamoDBClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    ...(endpoint ? { endpoint } : {}),
  });
  docClient = DynamoDBDocumentClient.from(raw);
  return docClient;
}

async function incrementCounter(key: string, amount = 1): Promise<void> {
  await getClient().send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: key },
      UpdateExpression: "ADD #c :incr",
      ExpressionAttributeNames: { "#c": "count" },
      ExpressionAttributeValues: { ":incr": amount },
    }),
  );
}

async function getCounter(key: string): Promise<number> {
  const result = await getClient().send(new GetCommand({ TableName: TABLE_NAME, Key: { pk: key } }));
  return (result.Item?.count as number) ?? 0;
}

export interface RecommendationMetricsInput {
  fallbackTriggered: boolean;
  latencyMs: number;
}

/**
 * Fire-and-forget-style metric recording -- a failure here must never
 * break the actual recommendation response. "Measure what matters" is
 * a first-class concern per spec §2.2, but never at the cost of
 * availability.
 */
export async function recordRequestMetrics(input: RecommendationMetricsInput): Promise<void> {
  try {
    await Promise.all([
      incrementCounter("metrics#total_requests"),
      incrementCounter("metrics#latency_sum_ms", Math.round(input.latencyMs)),
      input.fallbackTriggered ? incrementCounter("metrics#fallback_count") : Promise.resolve(),
    ]);
  } catch (err) {
    console.error(JSON.stringify({ event: "metrics.record_failed", error: String(err) }));
  }
}

export interface MetricsSnapshot {
  total_requests: number;
  fallback_count: number;
  fallback_rate: number;
  avg_latency_ms: number;
}

/** GET-side: reads the counters back and derives the rates. */
export async function getMetricsSnapshot(): Promise<MetricsSnapshot> {
  const [total, fallback, latencySum] = await Promise.all([
    getCounter("metrics#total_requests"),
    getCounter("metrics#fallback_count"),
    getCounter("metrics#latency_sum_ms"),
  ]);

  return {
    total_requests: total,
    fallback_count: fallback,
    fallback_rate: total > 0 ? Number((fallback / total).toFixed(3)) : 0,
    avg_latency_ms: total > 0 ? Math.round(latencySum / total) : 0,
  };
}
