import "dotenv/config";

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  if (!res.ok) {
    console.error(`List models failed: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    return;
  }

  const data = (await res.json()) as {
    models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
  };

  console.log("Models that support embedContent or batchEmbedContents:\n");
  for (const m of data.models ?? []) {
    const methods = m.supportedGenerationMethods ?? [];
    if (methods.includes("embedContent") || methods.includes("batchEmbedContents")) {
      console.log(m.name, "->", methods.join(", "));
    }
  }
}

main().catch(console.error);