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

  console.log("Models that support generateContent:\n");
  for (const m of data.models ?? []) {
    if (m.supportedGenerationMethods?.includes("generateContent")) {
      console.log(m.name);
    }
  }
}

main().catch(console.error);