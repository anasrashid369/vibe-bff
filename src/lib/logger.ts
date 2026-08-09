export interface LogEvent {
  event: string;
  provider?: string | null;
  latency_ms?: number;
  validation_passed?: boolean;
  fallback_triggered?: boolean;
  [key: string]: unknown;
}

/**
 * Structured JSON log lines to CloudWatch Logs (LocalStack-emulated).
 * Source for the fallback-frequency / schema-validation-failure-rate /
 * TMDB-latency dashboard described in spec §6.5.
 */
export function log(evt: LogEvent): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...evt }));
}

class Metrics {
  increment(metric: string): void {
    log({ event: "metric", metric });
  }
}

export const telemetry = new Metrics();
