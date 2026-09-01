# 0004 — Phased architecture and where the seams are

- **Date:** 2026-08-29
- **Status:** Accepted

## Context
No backend now, but later phases add a contact form API, self-hosted visitor
analytics, and a GitHub sync service — each needing a backend + database. The
Phase 1 code should absorb that without a rewrite.

## Decision
Three phases, with explicit, pre-placed seams so Phase 2 is additive:

| Seam | Phase 1 state | Phase 2 change |
|------|---------------|----------------|
| `site/js/config.js` | `API_BASE=""`, `DATA_URL="/data/projects.json"`, `features.contactApi=false`, `features.analytics=false` | `API_BASE="/api"`, `DATA_URL="${API_BASE}/projects"`, flip flags |
| `nginx/default.conf` | `location /api/ { proxy_pass ... }` block present but commented, marked `# PHASE 2` | uncomment |
| Contact section (`index.html`) | `mailto:` + social links, comment marking the swap point | `<form>` + `fetch`, guarded by `features.contactApi` |
| Project data | build-time `fetch-github.mjs` → committed JSON | GitHub sync job → `projects` table → `GET /api/projects`; build-time fetch demoted to seed/fallback |
| `docker-compose.yml` | `web`, `ngrok` | add `api`, `db` (postgres:16-alpine + volume) |
| Analytics | none | `site/js/analytics.js` beacon guarded by `features.analytics` → `POST /api/events` |

**Phase 2** — backend stack (FastAPI vs Node/Express) decided in a future ADR
`0006`. Postgres for storage. Migrations via Alembic or node-pg-migrate.
Endpoints: `POST /api/contact`, `POST /api/events`, `GET /api/projects`, plus a
scheduled GitHub refresh.

**Phase 3** — single-user admin auth for an analytics dashboard + contact inbox at
`/admin`; GitHub sync fully replaces build-time fetch (ETag/caching); optional
blog CMS; backups, healthchecks, CI; optional real domain + TLS.

## Consequences
- Frontend code paths for "static JSON" and "API" are the same fetch call — only
  `config.js` differs.
- nginx becomes a reverse proxy in front of the API on the same origin → no CORS.
- Phase boundaries are tracked in `tasks.md` (P1-*, P2-*, P3-*).

## Alternatives considered
- **Build Phase 2 infra now, unused:** premature; more surface to maintain with no
  current benefit.
- **Separate API subdomain instead of `/api` path:** introduces CORS and a second
  TLS/tunnel target for no gain at this scale.
