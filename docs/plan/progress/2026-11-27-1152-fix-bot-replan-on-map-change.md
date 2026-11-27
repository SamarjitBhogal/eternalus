---
title: 'Progress 2026-11-27: fix/bot-replan-on-map-change (phase/3 merge e3521feb)'
description: 'Phase 3, PR-38-HELPER-63 (Claude Code): merged phase/3 e3521feb (#183) into PR #184; two docs conflicts, both sides kept; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: fix/bot-replan-on-map-change (phase/3 merge e3521feb)

Phase 3 · fix/bot-replan-on-map-change (#184, a follow-up to PR #84) · sholtzman + Claude Code
(PR-38-HELPER-63)

- What was done: merged `phase/3-sprint-3-work` at `e3521feb` (one PR merge since `8ad77bfd`:
  #183, the Legend jump). The coordinator merged #183 first, so #184 needs it in its head before it
  merges. Two docs conflicts, both add/add at the same place: `INBOX.md` (Done: our DEC-379 and
  DEC-392 entry and #183's HC-B64 and HC-B65 entries) and the owner decisions log (our 2026-11-27
  batch and #183's jump batch). Both sides are kept, ours first. A line-multiset check of each
  merged file against both parents and the merge base `8ad77bfd` found no difference (merged = ours
  - theirs - base). `StateHasher.test.ts` merged without a conflict.
- Checks run: `npm run check` (Node 24.21.0) on the staged tree `8cdbaa87` before the commit,
  `EXIT=0`; its summary lines verbatim: "All matched files use Prettier code style!"; core "Test
  Files 322 passed (322)", "Tests 1964 passed (1964)"; protocol "Test Files 1 passed (1)", "Tests 33
  passed (33)"; client "Test Files 335 passed (335)", "Tests 2281 passed (2281)"; server "Test Files
  29 passed (29)", "Tests 165 passed (165)"; "Documentation check passed.". knip printed a
  configuration hint, not an error: "@eternalus/core apps/client knip.json Remove from
  ignoreDependencies". Then the checks line was written into this entry, and Prettier and the docs
  check ran again on it.
- Next step: Sam pushes the branch (#184) with the coordinator's script; after CI is green, the
  coordinator asks Sam to merge it.
