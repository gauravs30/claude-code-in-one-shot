# 0002 — GitHub project data via build-time fetch + curated allowlist

- **Date:** 2026-08-29
- **Status:** Accepted

## Context
Projects shown on the site come from `github.com/gauravs30`. Options for getting
that data to the browser: fetch client-side at runtime, fetch at build time, or
maintain the list fully by hand. GitHub's unauthenticated API allows 60 req/hr per
IP — fine for a build, risky for public traffic.

## Decision
`scripts/fetch-github.mjs` runs at build time (locally via `npm run fetch`, and
again in the Docker `fetch` stage). It reads the curated allowlist
`content/projects.yml`, calls the GitHub REST API for each repo, merges API
metadata with curated overrides (blurb, tags, featured, homepage), and writes
`site/data/projects.json`, which is committed. The browser only ever reads that
static JSON file.

Auth is optional: the script runs unauthenticated and uses `GITHUB_TOKEN` from the
environment if present.

On any fetch failure the script keeps the existing committed JSON and exits 0, so
builds are reproducible and work offline.

## Consequences
- No GitHub rate-limit exposure from visitor traffic; fast page load.
- Project data is only as fresh as the last build/fetch — acceptable for a
  portfolio. Phase 2's GitHub sync service ([0004](0004-phased-architecture-and-seams.md))
  replaces this with scheduled refresh.
- `content/projects.yml` uses a tiny hand-rolled YAML subset parser (scalars +
  inline arrays only) to stay dependency-free — keep that file simple.
- `site/data/projects.json` is generated; do not hand-edit.

## Alternatives considered
- **Client-side fetch:** zero tooling but rate-limited (60/hr/IP shared across all
  visitors) and slower first paint.
- **Fully manual list:** total control, no API, but stale metadata (stars,
  languages, last push) and more upkeep.
