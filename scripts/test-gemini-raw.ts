import "dotenv/config";

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  console.log("URL (key redacted):", url.replace(key, "***"));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Say hello in one word." }] }],
    }),
  });

  console.log("Status:", res.status, res.statusText);
  console.log("Body:");
  console.log(await res.text());
}

main().catch(console.error);