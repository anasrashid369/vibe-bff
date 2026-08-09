import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export interface ProviderSecrets {
  tmdbApiKey: string;
  geminiApiKey: string;
  claudeApiKey: string;
}

let cached: ProviderSecrets | undefined;

/**
 * Fetches provider credentials once at Lambda cold start, not per-request
 * (spec §10, Security Notes). Endpoint is overridden to LocalStack via
 * AWS_ENDPOINT_URL when running locally against `vibe-infra`.
 */
export async function getProviderSecrets(): Promise<ProviderSecrets> {
  if (cached) return cached;

  const client = new SecretsManagerClient({});
  const secretId = process.env.PROVIDER_SECRETS_ID ?? "vibe/provider-keys";
  const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

  if (!result.SecretString) {
    throw new Error(`Secret ${secretId} has no SecretString`);
  }

  cached = JSON.parse(result.SecretString) as ProviderSecrets;
  return cached;
}
