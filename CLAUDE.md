# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

Personal portfolio website for `github.com/gauravs30`, built in phases:

- **Phase 1 (current):** static site, no backend. Vanilla HTML/CSS/JS served by
  nginx, exposed publicly via ngrok, all in Docker. A dependency-free Node script
  fetches GitHub repo metadata at build time.
- **Phase 2 (planned):** backend API (`api`) + Postgres for a contact form,
  self-hosted visitor analytics, and a scheduled GitHub sync service.
- **Phase 3 (planned):** admin auth + dashboard, blog CMS, backups, CI, real
  domain + TLS.

Phase 1 code has deliberate seams so later phases are additive — see
`decisions/0004`.

## Layout

- `site/` — static site, nginx document root (`index.html`, `css/`, `js/`,
  `assets/`, `data/projects.json`). No build step.
  - `site/js/config.js` — **the phase seam**: `API_BASE` + feature flags.
  - `site/data/projects.json` — **generated** by the fetch script; do not hand-edit.
- `content/` — editable content: `profile.yml`, `projects.yml` (curated repo
  allowlist; only listed repos appear on the site).
- `scripts/` — `fetch-github.mjs` (build-time GitHub fetch, offline-safe,
  optional `GITHUB_TOKEN`), `dev-server.mjs` (local preview).
- `nginx/default.conf` — static serving, gzip, CSP/cache headers, `/healthz`,
  and a commented `/api/` proxy block (Phase 2 seam).
- `docker/Dockerfile` — multi-stage (Node fetch → `nginx:1.27-alpine`).
- `docker-compose.yml` — `web` + `ngrok` services.
- `decisions/` — ADR-lite records (the *why* behind each choice); `README.md`
  there has the index + template.
- `tasks.md` — phased task tracker (P1-/P2-/P3- IDs). Keep it updated.
- `.claude/` — `agents/code-reviewer.md` (read-only review subagent) and
  `settings.json` (PostToolUse hook running the reviewer on changed files).
  Excluded from the Docker image via `.dockerignore`.
- `.env` — git-ignored; `NGROK_AUTHTOKEN`, `NGROK_DOMAIN`, optional
  `GITHUB_TOKEN`. Template: `.env.example`.

## Common commands

```bash
npm run fetch          # refresh site/data/projects.json from GitHub (Node 18.14+)
npm run serve          # static preview of site/ at http://localhost:8080
docker compose up --build   # full stack: nginx at :8080, ngrok inspector at :4040
```

No test suite. No linter configured. Node is used only for the two scripts (no
`node_modules`).

## Conventions

- Ask for permission before creating new folders.
- Record non-obvious decisions as a new file in `decisions/` (next number,
  ADR-lite template) and add it to that folder's `README.md` index.
- Update `tasks.md` when task status changes.
- After editing `content/projects.yml`, re-run `npm run fetch`.
- Phase 1 keeps `content/profile.yml` and the hardcoded text in
  `site/index.html` in sync by hand.
- `site/data/projects.json` is generated — never edit it directly.

## Environment notes

- Docker is **not currently installed** on this machine. Phase 1 has been run as
  an interim via WSL (`python3 -m http.server` + ngrok Linux binary) — see
  `decisions/0006`. `docker compose up --build` remains the intended path once
  Docker Desktop is available.
