# 0005 — Show a curated repo allowlist, not all repos

- **Date:** 2026-08-29
- **Status:** Accepted

## Context
`gauravs30` has ~29 public repos. Some are intentionally imperfect (e.g.
`Research-Project-Pipeline-Detection-App` contains a deliberately broken app to
demo pipeline gating), and one is the profile-config repo (`gauravs30`). A
portfolio should present a deliberate, ordered selection.

## Decision
Only repos listed in `content/projects.yml` appear on the site. Each entry can set
`featured` (pin to top), `blurb` (override description), `tags`, `homepage`, and
`hide` (keep the entry, exclude from render). File order = display order after
featured items.

The file currently ships with placeholder entries; Gaurav finalizes the list
(task **P1-3 / P1-7**).

## Consequences
- Adding/removing a project = edit one YAML file + re-run `npm run fetch`.
- No accidental exposure of scratch/config repos.
- The site never reflects "all my GitHub activity" — that's the intent; a link to
  the full profile is in the hero and contact sections.

## Alternatives considered
- **All public repos, auto-sorted by stars/recency:** zero curation but includes
  noise and can't express "this one is my best work".
- **All-except-blocklist:** still surfaces new repos by default, which is the wrong
  default for a portfolio.
