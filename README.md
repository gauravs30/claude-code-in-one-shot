# Portfolio

[![Repo](https://img.shields.io/badge/GitHub-claude--code--in--one--shot-181717?logo=github)](https://github.com/gauravs30/claude-code-in-one-shot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Personal portfolio for [github.com/gauravs30](https://github.com/gauravs30).
Phase 1 is a static site served by **nginx** and exposed via **ngrok**, all in
Docker. Built to grow a backend + database in later phases without a rewrite —
see [`decisions/0004`](decisions/0004-phased-architecture-and-seams.md).

## What is this repo

This is a personal portfolio site, built phase-by-phase with
[Claude Code](https://claude.com/claude-code) — the "in one shot" in the repo
name refers to Phase 1 (scaffold, static site, Docker/nginx/ngrok topology,
build-time GitHub fetch, docs and decision records) having been produced in a
single Claude Code session, rather than the whole project being finished at
once. Phase 1 is functionally complete and running; Phases 2–3 (backend,
database, admin) are planned but not started — see [Phases](#phases) below.

## Architecture & phase seams

Phase 1 has no backend, but Phase 2 adds a contact-form API, self-hosted
visitor analytics, and a scheduled GitHub sync service — each needing a
backend + database. Rather than rewrite Phase 1 code later, a few seams were
pre-placed so Phase 2 is additive:

| Seam | Phase 1 state | Phase 2 change |
|------|---------------|-----------------|
| [`site/js/config.js`](site/js/config.js) | `API_BASE=""`, feature flags off | `API_BASE="/api"`, flip flags |
| [`nginx/default.conf`](nginx/default.conf) | `/api/` proxy block present but commented (`# PHASE 2`) | uncomment |
| Contact section (`site/index.html`) | `mailto:` + social links | `<form>` + `fetch`, guarded by a feature flag |
| Project data | build-time `fetch-github.mjs` → committed JSON | GitHub sync job → DB → `GET /api/projects` |

Full rationale and the complete seam table: [`decisions/0004`](decisions/0004-phased-architecture-and-seams.md).
Every non-obvious choice in this repo has its own record — see the
[decision index](decisions/README.md).

## Layout

```
site/          static site — nginx document root (HTML/CSS/JS, no build step)
content/       editable content: profile.yml, projects.yml (curated repo list)
scripts/       fetch-github.mjs (build-time data), dev-server.mjs (local preview)
nginx/         default.conf — static serving + commented Phase-2 /api proxy seam
docker/        Dockerfile — multi-stage: node fetch → nginx
docker-compose.yml   web + ngrok services
decisions/     ADR-lite records (the "why")
tasks.md       task tracker, phased
LICENSE        MIT
```

## Quickstart

```bash
# 1. configure
cp .env.example .env          # fill in NGROK_AUTHTOKEN + NGROK_DOMAIN

# 2. (optional) refresh project data from GitHub
npm run fetch                 # writes site/data/projects.json  (Node 20+)

# 3. run
docker compose up --build
```

- Site:            http://localhost:8080
- ngrok inspector: http://localhost:4040
- Public:          `https://<NGROK_DOMAIN>`

### Preview without Docker (Node)

```bash
npm run serve                 # static server for site/ on http://localhost:8080
```

### Run without Docker + public URL (current setup — see decisions/0006)

Docker isn't installed on this machine, so the site currently runs via WSL:

```powershell
# in WSL Ubuntu:
cd /mnt/c/Users/gaura/ClaudeCode/projects/site
nohup python3 -m http.server 8080 --bind 127.0.0.1 > /tmp/httpsrv.log 2>&1 &
nohup ~/ngrok http 8080 --log stdout > /tmp/ngrok.log 2>&1 &
curl -s http://127.0.0.1:4040/api/tunnels    # <- public_url is in here
```

Stop it:

```powershell
wsl -d Ubuntu -- pkill -f 'http.server|ngrok'
```

The public `*.ngrok-free.dev` URL changes each time ngrok restarts (no reserved
domain set). Switch to `docker compose up --build` once Docker is available.

## Content workflow

This is the one place that documents editing `content/` and running the
build-time GitHub fetch — see `CLAUDE.md` for the short version aimed at
Claude Code itself.

**Add / reorder a project** — edit `content/projects.yml`. Only repos listed
there appear on the site (see [`decisions/0005`](decisions/0005-curated-repo-allowlist.md)
for why); `featured: true` pins an entry to the top, file order sets the rest.
Each entry supports `repo`, `featured`, `blurb` (overrides the GitHub
description), `tags`, `homepage`, and `hide` (keep the entry but don't render
it) — see the comment header in the file itself. After editing, run:

```bash
npm run fetch   # regenerates site/data/projects.json — never hand-edit that file
```

then rebuild (`docker compose up --build`) or re-serve (`npm run serve`).

**Change bio / skills / links** — edit `content/profile.yml` **and** the matching
text in `site/index.html` (Phase 1 keeps them in sync by hand — see
[`decisions/0001`](decisions/0001-frontend-vanilla-no-build.md)). No rebuild
step needed for `profile.yml` itself since Phase 1 doesn't template it yet.

**Add a résumé** — drop `site/assets/resume.pdf`; the hero link un-hides itself.

## Troubleshooting

**`npm run fetch` fails with a syntax/runtime error** — the script uses
built-in `fetch` and needs **Node 18.14+** (see `engines` in `package.json`);
check `node --version` and upgrade if needed.

**`npm run fetch` warns `fetch failed` and exits 0** — this is the offline-safe
fallback: on any network or GitHub API error the existing
`site/data/projects.json` is left untouched and the process still exits 0, so
Docker builds stay reproducible offline. Check your network connection, that
each `repo:` in `content/projects.yml` exists and is spelled correctly, and
(if you're hitting it) the rate limit below.

**GitHub API rate limits** — the fetch runs unauthenticated (60 req/hr, shared
across your IP). If you're iterating quickly on `content/projects.yml`, set
`GITHUB_TOKEN` (a plain read-only PAT is enough) in `.env` to raise the limit
to 5,000 req/hr; the Dockerfile passes it through as a build arg.

**ngrok URL changes on every restart** — without a reserved domain
(`NGROK_DOMAIN` in `.env`), the free-tier `*.ngrok-free.dev` URL is
re-assigned each time the tunnel restarts. Reserve a domain in the ngrok
dashboard and set `NGROK_DOMAIN` to keep it stable, or re-fetch the URL from
`http://127.0.0.1:4040/api/tunnels` after every restart.

## Automated code review

`.claude/agents/code-reviewer.md` is a read-only review subagent (correctness,
security, resource safety, quality — full rubric in the file). `.claude/settings.json`
wires a `PostToolUse` hook so it reviews every file Claude changes
(`Write`/`Edit`/`MultiEdit`). Findings are fed back to Claude, not blocked.
Manage or disable it with `/hooks`; run it by hand with `@code-reviewer`.
Details in [`decisions/0007`](decisions/0007-automated-code-review-hook.md).

> New settings files aren't picked up mid-session — open `/hooks` once or restart
> Claude Code to activate the hook.

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Static site, nginx, ngrok, build-time GitHub fetch | in progress |
| 2 | Backend (`api`) + Postgres: contact form, visitor analytics, GitHub sync service | planned |
| 3 | Admin auth + dashboard, sync replaces build-time fetch, optional blog, backups/CI, real domain + TLS | planned |

Track work in [`tasks.md`](tasks.md). Every non-obvious choice is in
[`decisions/`](decisions/).
