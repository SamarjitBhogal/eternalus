---
title: 'Progress 2026-11-27: feat/corner-camp-clear-bonus (phase/3 merge e3521feb, HC-B68 INBOX item)'
description: "Phase 3, PR-38-HELPER-63 (Claude Code): merged phase/3 e3521feb (#183), both sides kept in two docs conflicts; the INBOX item HC-B68 records the DEC-423 critic's three better-than-design tidy-ups to the 2-level limit tests, for the owner to sign off; docs only, no code change."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/corner-camp-clear-bonus (phase/3 merge e3521feb, HC-B68 INBOX item)

Phase 3 · feat/corner-camp-clear-bonus (PR on `phase/3-sprint-3-work`, a follow-up to PR #153) ·
sholtzman + Claude Code (PR-38-HELPER-62, PR-38-HELPER-63)

- What was done: added the INBOX item HC-B68 under "Decisions needed from Sam", after HC-B45. The
  critic (architecture-reviewer) on DEC-423 found three better-than-design items that are not built:
  (a) one `Progression` method holds the level-limit cap, and `ProgressionSystem` and both
  level-limit tests in `xpSources.test.ts` call it; (b) the DEC-423 test takes each camp and its
  mini boss from `GUARD_PLANS`, not `corner-boss` and `corner-camp` by name (the critic wrote "the
  DEC-237 test"; that test already loops over every team-kill reward); (c) architecture 05 §13
  states DEC-423 as a design rule. The owner answers on Owner Calls. No code, no gameplay number and
  no behaviour changed.
- Phase/3 merge: merged `phase/3-sprint-3-work` at `e3521feb` (one PR merge since `8ad77bfd`: #183,
  the Legend jump), in the same commit. The coordinator merged #183 first, so this PR needs it in
  its head before it merges. Two docs conflicts, both add/add at the same place: `INBOX.md` (Done:
  our DEC-423 and DEC-393 entries and #183's HC-B64 and HC-B65 entries) and the owner decisions log
  (our two 2026-11-27 batches and #183's jump batch). Both sides are kept, ours first. A
  line-multiset check of each merged file against both parents and the merge base `8ad77bfd` found
  no difference (merged = ours + theirs - base).
- Checks run: `npm run check` (Node 24.21.0) on the staged tree `83fccf01` before the commit,
  `EXIT=0`; its summary lines verbatim: "All matched files use Prettier code style!"; core "Test
  Files 322 passed (322)", "Tests 1959 passed (1959)"; protocol "Test Files 1 passed (1)", "Tests 33
  passed (33)"; client "Test Files 335 passed (335)", "Tests 2281 passed (2281)"; server "Test Files
  29 passed (29)", "Tests 165 passed (165)"; "Documentation check passed.". knip printed a
  configuration hint, not an error: "@eternalus/core apps/client knip.json Remove from
  ignoreDependencies". Then the checks line was written into this entry, and Prettier and the docs
  check ran again on it.
- Next step: the coordinator sends the fast-forward push script to Sam; merge into phase/3 once CI
  is green. HC-B68, if approved, is built in one follow-up PR after the demo.
