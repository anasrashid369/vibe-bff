# vibe-bff

Backend-for-frontend for **Vibe**. Owns every provider secret (TMDB, Gemini,
Groq), holds prompt templates centrally, validates all LLM output against a
strict schema, and implements real multi-vendor failover down to a non-AI
fallback so the client never sees a dead screen.

## Status: Feature-complete MVP + Phase 2/3 extensions

### Implemented
- **Grounded recommendations** (`/v1/recommendations`) — TMDB-sourced
  candidates only; the LLM ranks and explains, never invents
- **Multi-vendor AI failover** — Gemini (primary) → Groq/Llama (fallback,
  free tier) → non-AI TMDB-popularity ranking. Verified under a real Gemini
  outage (503s), not just simulated.
- **Multi-page TMDB fetch** — pulls 3 pages per request so `excludeIds`
  filtering doesn't exhaust the candidate pool after a few interactions
- **Genre + poster grounding** — enriched onto final recommendations by
  matching back against original TMDB candidates (the LLM never sees or
  invents these fields)
- **Vibe search** (`/v1/search/vibe`) — server-side query embedding via
  Gemini's embedding model
- **Batch embedding** (`/v1/embed`) — embeds movie text for the client's
  local search index
- **Real observability** (`/v1/metrics`) — DynamoDB-backed counters:
  total requests, fallback rate, average latency
- **CI** — typecheck, test, and bundle verification on every push

## Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/recommendations` | POST | Grounded, ranked recommendations |
| `/v1/movies/candidates` | GET | Thin TMDB proxy (also used by onboarding) |
| `/v1/search/vibe` | POST | Embeds a free-text query |
| `/v1/embed` | POST | Batch-embeds arbitrary text |
| `/v1/metrics` | GET | Fallback rate, avg latency, request volume |
| `/v1/health` | GET | Liveness check |

## Structure

src/
handlers/ # Lambda entry points, router.ts dispatches by path/method
prompts/ # Centralized, versioned prompt templates
schemas/ # Zod schemas — the contract LLM output must satisfy
providers/ # gemini.ts, groq.ts, failover.ts
services/ # tmdb.ts, secrets.ts, embeddings.ts, metrics.ts
lib/ # Structured logging


## Getting started

```bash
npm install
cp .env.example .env   # fill in TMDB_READ_ACCESS_TOKEN, GEMINI_API_KEY, GROQ_API_KEY
npm test
npm run bundle          # produces dist/index.js for Lambda deployment
```

## Local dev scripts (`scripts/`)

Diagnostic/one-off scripts, run via `npx tsx scripts/<name>.ts`:
`test-tmdb.ts`, `test-gemini-direct.ts`, `test-groq-direct.ts`,
`test-recommendations.ts`, `list-gemini-models.ts`,
`list-embedding-models.ts`, `update-secret.ts`.

## Known limitations
- `actor` filtering on TMDB discovery isn't implemented (would need a
  `/search/person` lookup first) — genre-based grounding covers the MVP.
- Real token-streaming isn't implemented — see vibe-client's README for why.
