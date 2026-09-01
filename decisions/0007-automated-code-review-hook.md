# 0007 — Automated code-review subagent + file-change hook

- **Date:** 2026-08-31
- **Status:** Accepted

## Context
Wanted: whenever a file changes, a subagent reviews the changed file's code, and
that subagent lives in this repo's `.claude/` folder, using strong review
practices.

## Decision

**Subagent** — `.claude/agents/code-reviewer.md`:
- Read-only tools (`Read, Grep, Glob`) — a reviewer must never edit, and this also
  makes a review→edit→review feedback loop impossible from the agent side.
- `model: sonnet` — review quality matters more than latency here.
- Rubric embedded in the file: evidence-or-silence, no style policing, no praise/
  summary, correctness → security → resource/failure → interface contract → dead
  code → tests, with `blocker|major|minor|nit` severities and a fixed output
  format (`skipped: …` / `clean` / findings list). Project-aware (vanilla stack,
  no framework/tests expected, `projects.json` is generated).
- Also usable on demand via `@code-reviewer` or the Task tool.

**Trigger** — `.claude/settings.json`, `PostToolUse` hook, matcher
`Write|Edit|MultiEdit`, a single `type: "agent"` hook:
- The native agent-hook mechanism runs an agent with tools directly — no nested
  `claude -p` process, and no `jq` dependency (not installed here); the hook
  passes the tool-input JSON as `$ARGUMENTS` and the agent parses it.
- Prompt points the hook agent at `.claude/agents/code-reviewer.md` so the rubric
  is defined once.
- `timeout: 180`.
- **Not `FileChanged`**: `FileChanged` fires on every filesystem write including
  the review's own output and build artifacts, which risks a review storm / loop.
  `PostToolUse/Write|Edit|MultiEdit` scopes it to code Claude actually authored.
- **Non-blocking to edits**: on `PostToolUse` a hook "failure" (findings) is fed
  back to Claude as context and the turn continues — the edit is not reverted.
  Claude sees the findings and can fix them.

## Consequences
- Every code edit Claude makes triggers a review pass (cost + a few seconds).
  Disable or tune via `/hooks`, or narrow the matcher / add an `if:` path filter.
- `.dockerignore` already excludes `.claude/`, so none of this ships in the image.
- New settings files created mid-session aren't watched until `/hooks` is opened
  once or Claude Code restarts — so this hook goes live on the next session.

## Alternatives considered
- **`command` hook shelling to `claude -p`**: works but spawns a full nested
  agent per edit (slow, heavier), and needs robust stdin-JSON parsing without jq.
- **`FileChanged` event**: matches the literal ask but loops on its own writes and
  build output.
- **`Stop` hook (review once per turn)**: fewer runs, but loses the
  file-by-file immediacy the request asked for.
