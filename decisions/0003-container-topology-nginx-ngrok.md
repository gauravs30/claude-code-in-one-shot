# 0003 — Container topology: nginx + ngrok sidecar

- **Date:** 2026-08-29
- **Status:** Accepted

## Context
The site must run in Docker, be served by nginx, and be reachable publicly through
ngrok. Gaurav has an ngrok account and can reserve a static domain.

## Decision
`docker-compose.yml` defines two services:

- **`web`** — built from `docker/Dockerfile` (multi-stage: `node:20-alpine`
  runs the fetch script → `nginx:1.27-alpine` serves `site/`). Publishes
  `8080:80` locally. Has a `/healthz` endpoint + Docker healthcheck.
- **`ngrok`** — official `ngrok/ngrok:3` image, command
  `http --domain=${NGROK_DOMAIN} web:80`, `NGROK_AUTHTOKEN` from env. Publishes
  `4040:4040` for the local request inspector.

Both share the default compose network; ngrok reaches the site at `http://web:80`.
Secrets/config live in a git-ignored `.env` (`.env.example` is the template).

## Consequences
- `docker compose up --build` is the single command to go from clone to public URL.
- Reserved domain → stable public URL across restarts.
- The tunnel is only up while the compose stack runs; ngrok free-tier limits apply.
- Phase 3 may swap ngrok for Caddy/Traefik + a real domain + TLS — isolated to the
  `ngrok` service + DNS, no app changes.

## Alternatives considered
- **ngrok run manually outside Docker:** fewer moving parts in compose but an extra
  manual step and no one-command startup.
- **Ephemeral ngrok URL:** simpler (no domain reservation) but the URL changes on
  every restart — bad for sharing a portfolio link.
- **ngrok config file (`ngrok.yml`) instead of CLI args:** equivalent; CLI args in
  the compose `command` keep everything in one file.
