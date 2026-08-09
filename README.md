# vibe-bff

Backend-for-frontend for **Vibe**. Owns every provider secret (TMDB, LLM
APIs), holds prompt templates centrally, validates all LLM output against
a strict schema before it reaches the client, and implements multi-vendor
failover down to a non-AI fallback so the client never sees a dead screen.

## Why a BFF

A decompiled Flutter APK exposes any key embedded in the client binary
within minutes. Routing every secret-requiring call through this service
means keys are rotatable without a client release, prompt templates can
change without an app-store update, and response shape is validated once
here instead of on-device.

## Structure

```
src/
  handlers/     # Lambda entry points (API Gateway integration)
  prompts/      # Centralized, versioned prompt templates
  schemas/      # Zod schemas — the contract the LLM output must satisfy
  providers/    # LLM provider adapters + the failover interceptor
  services/     # TMDB proxy, Secrets Manager client
  lib/          # Structured logging / telemetry
```

## Endpoints (MVP)

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/recommendations` | POST | Grounded, ranked recommendations with reasons |
| `/v1/search/vibe` | POST | Phase 2 — semantic search |
| `/v1/movies/candidates` | GET | Thin TMDB proxy |
| `/v1/health` | GET | Liveness + upstream status |

## Multi-vendor failover

`src/providers/failover.ts` tries the primary LLM provider, validates its
JSON against the Zod schema, retries the secondary provider on failure
(Phase 2), and always falls through to a non-AI TMDB-only ranking as a
last resort — every branch is instrumented via `telemetry`.

## Getting started

```bash
npm install
npm test
```

Deployment target is AWS Lambda behind API Gateway, defined as Terraform
in [`vibe-infra`](https://github.com/YOUR_ORG/vibe-infra) and run against
LocalStack locally.

## Status

Scaffold only — Phase 0. Handlers are wired but `tmdb.ts` and the
provider `call()` implementations are stubs (`throw new Error("Not
implemented")`) pending Phase 1.
