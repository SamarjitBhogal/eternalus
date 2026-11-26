---
title: 'Progress 2026-11-26: feat/developer-menu-sim-mode (review fixes)'
description: 'Phase 3 / sprint 3, sholtzman + Claude Code: PR #112 reviewer fixes on the branch, merges of 9766ce8d and phase/3 67dbae61, doc 13 wording.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/developer-menu-sim-mode (review fixes)

Phase 3 / sprint 3 · feat/developer-menu-sim-mode (PR #112) · sholtzman + Claude Code
(MEMORY-CLEANUP-8 to -10)

- What was done: the reviewer fixed the PR #112 review findings on the branch (Sam's rule of
  2026-11-25), on top of claudiodh's head `9766ce8d`:
  - Checked claudiodh's items (2) and (4) by a deliberate break each: inverting the Rover check in
    the missing-role chooser turned 6 tests red (5 in `missingRoleChooser.test.ts`, 1 in
    `Simulation.simMode.test.ts`); breaking the Follow camera target turned the new
    `Match.test.ts` test red.
  - Doc 13 §10: the bridge line now says that Follow moves only the camera, and the sim mode note
    says that Follow uses `dev-follow`, not §4's `dev-toggle`. Two wording cuts from the ponytail
    review shorten both sentences.
  - Merged `9766ce8d`. Git found two merge bases. The result keeps claudiodh's choice in
    `Simulation.capture.test.ts` (his `33a6dc9a` dropped the phase/3 check of the dark Legends'
    deaths on purpose), and one copy of the 2026-11-15 `fix/legend-respawn` entry in
    `PROGRESS.md` (`9766ce8d` had it twice, byte for byte).
  - Merged phase/3 `67dbae61`. Two conflicts (`INBOX.md`, the architecture 03 event catalogue),
    both where each side added lines at the same place; phase/3's lines first. A content check
    found every line of both parents in the result.
  - The pre-push critic's one blocker (the capture-test block) was rejected: claudiodh dropped it
    on purpose, as above.
- Checks run: `npm run check` EXIT=0 on `8bb537aa` plus this commit's changes, after `npm ci`
  (core 1863, protocol 31, client 2194, server 163 tests passed; docs check passed).
- Next step: push through the coordinator. The owner answers item (1) on the Owner Calls page
  ("PR112 (1) Sim mode bot"); then DEC-356 is recorded and the `INBOX.md` slice 3 item is updated.
