# Portfolio

Personal portfolio for [github.com/gauravs30](https://github.com/gauravs30).
Phase 1 is a static site served by **nginx** and exposed via **ngrok**, all in
Docker. Built to grow a backend + database in later phases without a rewrite —
see [`decisions/0004`](decisions/0004-phased-architecture-and-seams.md).

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

## Common tasks

**Add / reorder a project** — edit `content/projects.yml` (only listed repos
show; `featured: true` pins to top), then `npm run fetch`, then rebuild.

**Change bio / skills / links** — edit `content/profile.yml` **and** the matching
text in `site/index.html` (Phase 1 keeps them in sync by hand — see
[`decisions/0001`](decisions/0001-frontend-vanilla-no-build.md)).

**Add a résumé** — drop `site/assets/resume.pdf`; the hero link un-hides itself.

**GitHub API rate limits** — the fetch runs unauthenticated (60 req/hr is plenty).
Set `GITHUB_TOKEN` in `.env` to raise it; the Dockerfile passes it through as a
build arg.

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
