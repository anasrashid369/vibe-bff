import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export interface ProviderSecrets {
  tmdbApiKey: string;
  geminiApiKey: string;
  claudeApiKey: string;
}

let cached: ProviderSecrets | undefined;
let client: SecretsManagerClient | undefined;

function getClient(): SecretsManagerClient {
  if (client) return client;

  // AWS_ENDPOINT_URL, if set, redirects the SDK at LocalStack instead of
  // real AWS — same pattern Terraform's providers.tf uses. Kept explicit
  // here (rather than relying on the SDK's implicit env resolution) so
  // it's obvious what's happening when reading this file.
  const endpoint = process.env.AWS_ENDPOINT_URL;

  client = new SecretsManagerClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    ...(endpoint ? { endpoint } : {}),
  });

  return client;
}

/**
 * Fetches provider credentials once at Lambda cold start, not per-request
 * (spec §10, Security Notes). Cached in module scope so warm Lambda
 * invocations reuse the same fetch instead of hitting Secrets Manager
 * on every request.
 */
export async function getProviderSecrets(): Promise<ProviderSecrets> {
  if (cached) return cached;

  const secretId = process.env.PROVIDER_SECRETS_ID ?? "vibe/local/provider-keys";
  const result = await getClient().send(new GetSecretValueCommand({ SecretId: secretId }));

  if (!result.SecretString) {
    throw new Error(`Secret ${secretId} has no SecretString`);
  }

  cached = JSON.parse(result.SecretString) as ProviderSecrets;
  return cached;
}