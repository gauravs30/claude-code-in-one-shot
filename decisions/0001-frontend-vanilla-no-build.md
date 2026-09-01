# 0001 — Frontend: vanilla HTML/CSS/JS, no build step

- **Date:** 2026-08-29
- **Status:** Accepted

## Context
Phase 1 is a static portfolio with a handful of sections and a projects grid.
There is no team, no component reuse pressure yet, and the site must be trivially
served by nginx. Future phases add a backend but not necessarily a heavy frontend.

## Decision
Hand-author `site/index.html`, one `styles.css`, and a small `main.js`. No
bundler, no framework, no `node_modules` for the site itself. The only Node code
is a dependency-free build-time data script (see [0002](0002-github-data-build-time-fetch.md)).

## Consequences
- Nginx serves `site/` verbatim; the Docker image needs no frontend build stage.
- Fast first paint, no hydration, easy to reason about and debug.
- Theming is CSS custom properties + a 3-state toggle in `main.js`.
- Cost: content in `index.html` is duplicated from `content/profile.yml` (kept in
  sync by hand for now). If the page grows, revisit with a static templating step.

## Alternatives considered
- **Astro (static output):** nicer components + clean SSR upgrade path, but adds a
  build toolchain and `node_modules` for a 4-section site. Deferred, not rejected
  forever.
- **Vite + React / Next static export:** heavier bundle, SEO/meta config overhead,
  no Phase-1 benefit.
