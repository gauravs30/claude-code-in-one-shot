# Decision Records

Lightweight ADRs (Architecture Decision Records). One file per decision so we can
reload just the relevant context later instead of re-reading the whole project.

## Naming

`NNNN-short-kebab-title.md` — `NNNN` is a zero-padded running number.

## Template

```markdown
# NNNN — Title

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded by NNNN | Deprecated

## Context
What forces are at play — the problem, constraints, requirements.

## Decision
What we chose to do.

## Consequences
What becomes easier, what becomes harder, follow-ups this creates.

## Alternatives considered
Options we rejected and why.
```

## Index

| # | Title | Status |
|---|-------|--------|
| [0001](0001-frontend-vanilla-no-build.md) | Frontend: vanilla HTML/CSS/JS, no build step | Accepted |
| [0002](0002-github-data-build-time-fetch.md) | GitHub project data via build-time fetch + curated allowlist | Accepted |
| [0003](0003-container-topology-nginx-ngrok.md) | Container topology: nginx + ngrok sidecar | Accepted |
| [0004](0004-phased-architecture-and-seams.md) | Phased architecture and where the seams are | Accepted |
| [0005](0005-curated-repo-allowlist.md) | Show a curated repo allowlist, not all repos | Accepted |
| [0006](0006-local-run-without-docker.md) | Local run without Docker (interim) — WSL http.server + ngrok | Accepted (interim) |
| [0007](0007-automated-code-review-hook.md) | Automated code-review subagent + PostToolUse hook | Accepted |
