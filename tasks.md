# Portfolio — Task Tracker

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped
**Current phase: Phase 1 — Static portfolio**

Related: [`decisions/`](decisions/) for the *why* behind each choice ·
[plan](../../.claude/plans/lets-plan-for-a-nifty-wilkinson.md)

---

## Phase 1 — Static portfolio (nginx + ngrok in Docker)

### Scaffold & content
- [x] P1-1  Repo layout + `package.json` (no deps, `npm run fetch` / `serve`)
- [x] P1-2  `content/profile.yml` — name, tagline, about, socials, skills
- [x] P1-3  `content/projects.yml` — curated repo allowlist (**placeholders — Gaurav to finalize**)

### Build-time GitHub fetch
- [x] P1-4  `scripts/fetch-github.mjs` — YAML read + GitHub API + merge → `site/data/projects.json`
- [x] P1-5  Offline-safe fallback (keep committed JSON, exit 0 on failure)
- [x] P1-6  Optional `GITHUB_TOKEN` support
- [ ] P1-7  Run `npm run fetch` with the finalized repo list and commit real `projects.json`

### Static site
- [x] P1-8  `site/index.html` — semantic sections, SEO/OG meta, skip link
- [x] P1-9  `site/css/styles.css` — responsive, theme tokens, auto/light/dark
- [x] P1-10 `site/js/config.js` — API_BASE + feature flags (the phase seam)
- [x] P1-11 `site/js/main.js` — theme toggle + project card rendering + error states
- [x] P1-12 `site/assets/` — favicon, og-image placeholders
- [x] P1-13 Add real `site/assets/resume.pdf` (copied from Desktop CV)
- [x] P1-14 Fill LinkedIn URL in `index.html` + `content/profile.yml`

### nginx
- [x] P1-15 `nginx/default.conf` — static serving, gzip, cache + security headers
- [x] P1-16 `/healthz` endpoint
- [x] P1-17 Commented `/api/` proxy block (Phase 2 seam)

### Docker + ngrok
- [x] P1-18 `docker/Dockerfile` — multi-stage (node fetch → nginx)
- [x] P1-19 `docker-compose.yml` — `web` + `ngrok` services
- [x] P1-20 `.env.example`, `.gitignore`, `.dockerignore`
- [x] P1-21 Create real `.env` with ngrok authtoken (domain left blank → ephemeral URL)
- [-] P1-22 `docker compose up --build` — **Docker not installed on this machine.**
        Ran without Docker instead (see `decisions/0006`): WSL `python3 -m http.server`
        + ngrok linux binary. Verified locally (localhost:8080) and via the public
        ngrok URL in a browser. Do this step once Docker/Docker Desktop is available.
- [x] P1-22b Fixed `[hidden]` CSS bug — `.btn` `display` was overriding the `hidden`
        attribute, so the résumé button showed with no PDF present.

### Dev tooling
- [x] P1-T1 `.claude/agents/code-reviewer.md` — read-only review subagent with rubric
- [x] P1-T2 `.claude/settings.json` — PostToolUse (`Write|Edit|MultiEdit`) agent hook that runs the reviewer on each changed file (see `decisions/0007`)
- [x] P1-T3 Activate the hook: opened `/hooks` / restarted Claude Code — hook is now live

### Docs & tracking
- [x] P1-23 `tasks.md` (this file)
- [x] P1-24 `decisions/` seed ADRs + README
- [x] P1-25 root `README.md` quickstart
- [x] P1-26 `git init` + first commit (`6a57682`)
- [x] P1-28 `projects/CLAUDE.md` — project overview, layout, commands, conventions (commit `91b26f0`);
        parent `C:\Users\gaura\ClaudeCode\CLAUDE.md` trimmed to a pointer (untracked, outside the repo)
- [ ] P1-27 (optional) Lighthouse pass ≥ 90 perf/SEO/a11y

---

## Phase 2 — Backend + database  *(not started)*

- [ ] P2-1  ADR: backend stack (FastAPI vs Node/Express)
- [ ] P2-2  Add `api` + `db` (postgres:16-alpine + volume) services to compose
- [ ] P2-3  Uncomment nginx `/api/` proxy; set `API_BASE="/api"` in `config.js`
- [ ] P2-4  DB schema + migrations tool (Alembic / node-pg-migrate)
- [ ] P2-5  Contact form: `POST /api/contact` (validate, rate-limit, store, optional SMTP)
- [ ] P2-6  Frontend: swap `mailto:` list for a real `<form>` + fetch (behind `features.contactApi`)
- [ ] P2-7  Analytics: `site/js/analytics.js` beacon + `POST /api/events` + `events` table (no cookies)
- [ ] P2-8  GitHub sync service: scheduled job → `projects` cache table + `GET /api/projects`
- [ ] P2-9  Point `DATA_URL` at `${API_BASE}/projects`; build-time fetch becomes seed/fallback
- [ ] P2-10 `.env` gains DB + SMTP vars; update `.env.example`

---

## Phase 3 — Hardening & extras  *(not started)*

- [ ] P3-1  Admin auth (single-user) for analytics dashboard + contact inbox at `/admin`
- [ ] P3-2  GitHub sync fully replaces build-time fetch; add ETag / HTTP caching
- [ ] P3-3  Optional blog/writing CMS (posts table + admin editor + public render)
- [ ] P3-4  Backups (pg_dump cron), compose healthchecks for all services
- [ ] P3-5  Structured logging + basic CI (lint/build)
- [ ] P3-6  Optional: ngrok → Caddy/Traefik + real domain + TLS
