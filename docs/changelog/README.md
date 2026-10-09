---
title: Changelog index
description: One entry per phase (and per large change) recording exactly what was changed, added or removed and why; read this to see how the repository evolved, or before writing the entry for your own change.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [changelog, process]
related: ['docs/process/sdlc.md', 'docs/plan/PROGRESS.md']
---

# Changelog index

**Purpose.** Read this to find the record of what changed in the repository and why. Entries
are written by whoever makes the change (human or agent) and are part of the Definition of
Done for a phase (`docs/process/sdlc.md` §2). `docs/plan/PROGRESS.md` is the day-to-day log;
this folder is the curated, per-change explanation.

## Format

One file per phase or large change: `YYYY-MM-DD-<topic>.md` with the standard frontmatter and
three sections, each a table with a **why** column: **Added**, **Changed**, **Removed**. Every
row names the path. A change to a guardrail also links its ADR. Keep rows factual; opinions go
in `docs/reviews/`.

## Entries

| Date       | Entry                                                                                              | Scope                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 2026-09-30 | [Phase 0 — documentation and harness foundation](2026-09-30-phase-0-foundation.md)                 | Docs tree, ADRs 0003–0009, agent harness, docs check, root file updates                             |
| 2026-09-30 | [Phase 0 pull request body](2026-09-30-phase-0-pull-request.md)                                    | Ready-to-paste PR description for the Phase 0 PR                                                    |
| 2026-10-03 | [INBOX decisions and Sprint 1 session prompts](2026-10-03-inbox-decisions-and-sprint-1-prompts.md) | Owner decisions recorded, plan re-cut to 2026-11-27, Warrior rename, screen flow, Ultracode prompts |
| 2026-10-05 | [PR: feat/map-generator](pr-feat-map-generator.md)                                                 | Map audit and config-driven `MapGenerator`, `WorldMap`, `Renderer` port; reviewer Aryan Walanj      |

## Related

- [`../process/sdlc.md`](../process/sdlc.md)
- [`../plan/PROGRESS.md`](../plan/PROGRESS.md)
- [`../reviews/2026-09-30-scaffold-review.md`](../reviews/2026-09-30-scaffold-review.md)
