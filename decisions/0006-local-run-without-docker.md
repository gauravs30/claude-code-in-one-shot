# 0006 — Local run without Docker (interim)

- **Date:** 2026-08-31
- **Status:** Accepted (interim — supersedes nothing; `docker compose` remains the target)

## Context
Asked to `docker compose up` and get the site running. Docker is not installed on
this machine — checked Windows PATH, `C:\Program Files`, `%LOCALAPPDATA%`, and the
`Ubuntu` WSL2 distro (no `docker` binary, daemon inactive). Installing Docker
Desktop needs an interactive GUI install + likely reboot. The user chose "run
without Docker now" and an ephemeral ngrok URL (`NGROK_DOMAIN` was left blank).

## Decision
Run the Phase 1 static site without containers, using tooling already present:

- **Server:** `python3 -m http.server 8080 --bind 127.0.0.1`, run inside WSL
  Ubuntu, serving `/mnt/c/Users/gaura/ClaudeCode/projects/site`.
- **Tunnel:** official ngrok v3 Linux binary downloaded to `~/ngrok` in WSL
  (the Windows ngrok.exe is quarantined by Windows Defender as PUA — not fought).
  Authtoken read from `.env` into `~/.config/ngrok/ngrok.yml` via
  `ngrok config add-authtoken`. `ngrok http 8080`, ephemeral `*.ngrok-free.dev` URL.
- Both processes started with `nohup … &` in the WSL distro; they live until the
  machine reboots, `wsl --shutdown`, or the process is killed.

The `docker/`, `nginx/`, and `docker-compose.yml` setup is unchanged and is still
the intended way to run this — see [0003](0003-container-topology-nginx-ngrok.md).

## Consequences
- `python http.server` does **not** apply `nginx/default.conf` (no gzip, no CSP /
  security headers, no cache-control). Fine for a preview; not representative of
  production behavior.
- Ephemeral URL changes on every ngrok restart. ngrok free also shows a one-time
  interstitial page to each visitor.
- Restart is manual (no `restart: unless-stopped`). If the box reboots, re-run the
  two commands (documented in README "Run without Docker").
- Surfaced a real bug fixed in `site/css/styles.css`: `[hidden] { display: none
  !important; }` was missing, so `.btn`'s `display` kept the résumé button visible
  even when `main.js` set `hidden`.

## Alternatives considered
- **Install Docker Desktop:** the planned path; deferred by user for time.
- **Docker Engine inside WSL:** needs `sudo` (interactive password) + WSL systemd;
  more setup than the task warranted right now.
- **`cloudflared` tunnel:** avoids the Defender PUA flag, but switches away from the
  chosen tool (ngrok) for no lasting benefit.
