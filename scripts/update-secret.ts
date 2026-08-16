import "dotenv/config";
import { SecretsManagerClient, PutSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function main() {
  const tmdbApiKey = process.env.TMDB_READ_ACCESS_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const claudeApiKey = process.env.ANTHROPIC_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!tmdbApiKey || !geminiApiKey) {
    throw new Error("TMDB_READ_ACCESS_TOKEN and GEMINI_API_KEY must be set in .env first");
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    endpoint: process.env.AWS_ENDPOINT_URL ?? "http://localhost:4566",
  });

  const secretId = process.env.PROVIDER_SECRETS_ID ?? "vibe/local/provider-keys";

  await client.send(
    new PutSecretValueCommand({
      SecretId: secretId,
      SecretString: JSON.stringify({
        tmdbApiKey,
        geminiApiKey,
        claudeApiKey: claudeApiKey ?? "REPLACE_ME",
        groqApiKey: groqApiKey ?? "REPLACE_ME",
      }),
    }),
  );

  console.log(`Updated secret "${secretId}" in LocalStack with real keys.`);
}

main().catch(console.error);
