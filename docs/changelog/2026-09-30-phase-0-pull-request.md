---
title: Phase 0 pull request body
description: The ready-to-paste pull-request description for the docs/phase-0-foundation branch into main (reviewer SamarjitBhogal), following the repository's PR template; read this when opening or reviewing the Phase 0 PR.
audience: [humans]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [changelog, phase-0, pull-request]
related:
  [
    'docs/changelog/2026-09-30-phase-0-foundation.md',
    'docs/plan/phase-0-documentation-and-harness.md',
  ]
---

# Phase 0 pull request body

**Purpose.** Copy the block below into the PR from `docs/phase-0-foundation` into `main`.
Reviewer: **SamarjitBhogal**. Title (Conventional Commit, squash message):

`docs(docs): Phase 0 — design, plan, requirements, reference, research and agent harness`

---

## Summary

Phase 0 of the plan: the complete documentation set and the agentic-coding harness the
requirements document asks for, plus the decisions that resolve the contradictions between
the requirements doc, the game doc and the scaffold. No game code, no dependencies.

Start at `docs/README.md`. Full file-by-file record with reasons:
`docs/changelog/2026-09-30-phase-0-foundation.md`. Critical review of the scaffold and of
`feat/map`: `docs/reviews/2026-09-30-scaffold-review.md`.

## Why

The team concern in the game doc ("not everyone understands the full game design yet, which
risks conflicting implementations") and the requirements doc's deliverables list: a phased,
sprint-level plan with tests and metrics; architecture split by theme; the reference split by
focus with suggestions; a requirements folder; a research folder with citations; and a
harness for Claude Code plus agent-agnostic files. Decisions recorded as ADRs 0003–0009:
TypeScript everywhere, React + Redux for UI, IndexedDB behind one controller, entity model
(shallow inheritance + composition), phase branching model, docs structure + frontmatter,
config-driven map generation.

## What to review (suggested order, ~60 minutes)

1. `docs/README.md` → `docs/architecture/README.md` → `01`, `02`, `04`, `06` (the core design).
2. `docs/decisions/0003`–`0009` (the decisions; push back here if you disagree).
3. `docs/plan/README.md` and `phase-1-simulation-kernel-and-world.md` (what we build first).
4. `docs/process/git-workflow.md` (how phase PRs and stacked branches work — affects you as
   `main` owner).
5. `AGENTS.md`, `.claude/settings.json`, `scripts/hooks/*.mjs` (the harness).
6. `docs/architecture/06-map-and-minimap.md` "review notes" (feedback for `feat/map`).

## How it was tested

- `npm run check` (format, lint, typecheck, knip, tests + coverage, build, docs check) green
  locally; CI repeats it on ubuntu/macos/windows.
- New guardrail `npm run docs:check` validates frontmatter, relative links + anchors and the
  generated index of 86 docs; `npm run docs:index` regenerates the index.
- Hook scripts run by hand with sample stdin (`docs/agents/tool-setup.md` §6).

## Checklist

- [x] `npm run check` passes locally
- [x] Tests added or updated — n/a (no code); the docs check is the new automated test
- [x] Guardrail changes justified: `package.json` `check` + CI gain a docs step, `eslint.config.js`
      gains a globals block for `scripts/**/*.mjs`, `knip.json` gains the scripts entry
      (ADR 0008); nothing relaxed
- [x] No new dependencies
- [x] Changes stay within the scope of the task (Phase 0 = documentation + harness)
- [x] Docs updated (this PR is docs); `docs/plan/PROGRESS.md` entry appended

## Follow-ups (not in this PR)

- Product-owner decisions DEC-01…DEC-10 in `INBOX.md` (term dates, instructor confirmation of
  React, team-as-property, `feat/map` reconciliation, reviewers, world scale, cut line,
  naming, discrepancies, INBOX visibility).
- Team walkthrough of the docs before Phase 1 (sprint 0.5).
- Branch protection for `phase/*` branches like `main` (`docs/process/guardrails.md` §5).
