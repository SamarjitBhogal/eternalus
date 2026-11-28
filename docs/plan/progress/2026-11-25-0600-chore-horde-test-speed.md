---
title: 'Progress 2026-11-25: chore/horde-test-speed (merge of feat/map-work-forts-towers bb067900)'
description: 'Phase 3, sholtzman + Claude Code: PR #154 takes in its base PR #152 at bb067900; two append-only conflicts, both sides kept.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: chore/horde-test-speed (merge of feat/map-work-forts-towers bb067900)

Phase 3 / map work · chore/horde-test-speed (PR #154, into PR #152) · sholtzman + Claude Code
(MEMORY-CLEANUP-8)

- What was done: merged `feat/map-work-forts-towers` (`bb067900`) into the branch, because PR #154
  conflicted with its base. Two conflicts, both in append-only files, and both sides were added at
  the same place: `INBOX.md` (HC-B32 here, the dependency audit item there) and the owner
  decisions log (DEC-357 here, DEC-358 and DEC-340 there). Both sides are kept. A line-count check
  of each file against both parents found no lost line. No code changes.
- Checks run: first `npm run check` → `EXIT=1` under a machine load of about 50: one client test
  timed out ("Test timed out in 60000ms", `Match.lifecycle.test.ts` "adopts its own spawn, never
  a roster bot of the same class and team (DEC-149)"); core, protocol and server passed. That file
  alone: "Tests 16 passed (16)". Second `npm run check` at load 1 → `EXIT=0`
  (`eternalus-agent-work/horde-test-speed/check-5.log`): core "Tests 1851 passed (1851)";
  protocol "Tests 29 passed (29)"; client "Tests 2107 passed (2107)"; server "Tests 114 passed
  (114)"; "Documentation check passed."; then `prettier --check` and `npm run docs:check` with
  this entry.
- Next step: unchanged. `HORDE_WALK_TIMEOUT_MS` goes after PR #84 reaches PR #152's line, with CI
  times on both runners as the proof.
