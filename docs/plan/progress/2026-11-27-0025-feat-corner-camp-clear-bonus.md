---
title: 'Progress 2026-11-27: feat/corner-camp-clear-bonus (DEC-393, DEC-423)'
description: 'Phase 3, PR-38-HELPER-59 and -61 (Claude Code): the owner kept DEC-375 and chose that the corner camp pays the camp clear bonus like a forest camp (DEC-393), inside the 2-level limit (DEC-423); one content entry, one test changed, one guard test.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/corner-camp-clear-bonus (DEC-393, DEC-423)

Phase 3 · feat/corner-camp-clear-bonus (from `phase/3-sprint-3-work` at `8ad77bfd`, a follow-up to
PR #153) · sholtzman + Claude Code (PR-38-HELPER-59, PR-38-HELPER-61)

- What was done: built the owner's answer "PR153 (2c)" A on Owner Calls v104 (DEC-393). DEC-375
  stands (HC-B55 B): only the Legend that killed a camp's last mob gets the clear bonus. The corner
  camp now pays that bonus like a forest camp (PR153 (2b) A): `XP_SOURCES.campCleared` has a
  `corner-camp` entry with the forest camps' value. Its mini boss still pays its `teamKills` XP to
  the whole team. PR153 (1b) A ("near the camp") is recorded in DEC-393 and changes nothing under
  DEC-375. Test: `ProgressionSystem.camps.test.ts` "pays the clear bonus for a corner camp too"
  replaces "pays no clear bonus for a corner camp". Fail-first: run before the content entry
  existed, it failed with "expected 0 to be greater than 0" (1 failed, 2 passed). Docs: DEC-393
  in the owner decisions log, an INBOX Done entry, architecture 05 §18, and the
  `ProgressionSystem` and `xpSources.ts` comments.
- DEC-423 (owner answer HC-Q131 A on Owner Calls v108): the 2-level limit of a mini boss kill
  includes the corner camp's clear bonus. New test in `xpSources.test.ts`: from one XP short of
  each level, the corner boss's capped team XP plus the corner camp's bonus lifts a Legend 2
  levels at most. Fail-first: with the bonus set to 250 it failed with "level 1: expected 4 to be
  less than or equal to 2" (1 failed, 4 passed); restored, the staged tree was unchanged. Docs:
  DEC-423 in the owner decisions log, HC-Q131 moved to INBOX Done, architecture 05 §18, and the
  `xpSources.ts` comment.
- Checks run: `npm run check` (Node 24.21.0) on the staged tree `843bae8d` before the commit,
  `EXIT=0`; its summary lines verbatim: "All matched files use Prettier code style!"; core "Test
  Files 317 passed (317)", "Tests 1924 passed (1924)"; protocol "Test Files 1 passed (1)", "Tests 31
  passed (31)"; client "Test Files 334 passed (334)", "Tests 2269 passed (2269)"; server "Test Files
  29 passed (29)", "Tests 163 passed (163)"; "Documentation check passed.". knip printed a
  configuration hint, not an error: "@eternalus/core apps/client knip.json Remove from
  ignoreDependencies". Then the checks line was written into this entry, and Prettier and the docs
  check ran again on it.
- Next step: the coordinator sends the push script to Sam; merge into phase/3 once CI is green.
