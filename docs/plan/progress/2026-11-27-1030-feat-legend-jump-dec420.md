---
title: 'Progress 2026-11-27: feat/legend-jump (DEC-420, the jump cards)'
description: 'Phase 3 / sprint 3 work, sholtzman + Claude Code: the owner answers on the Legend jump cards (DEC-420): a stun in the air ends the jump, the snapshot names the height elevation, INBOX HC-B64 and HC-B65 closed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/legend-jump (DEC-420, the jump cards)

Phase 3 / sprint 3 work · feat/legend-jump (PR #183) · sholtzman + Claude Code

- What was done: the owner's Owner Calls v108 answers on the jump cards are DEC-420.
  Core: a stun (`cannot-move`) or the countdown hold ends a jump in the air at once
  (`JumpSystem` calls `Jump.land`); a slow does not change it (HC-Q127 C). The snapshot group
  `jump` is now `elevation` (HC-B64 B); the command, the component and the input action keep
  `jump`. Code comments cite DEC-420 instead of the open cards (HC-Q123 to HC-Q128).
  Merged phase/3 8ad77bfd (#177); one conflict in the decisions log, both batches kept.
  Docs: DEC-420 batch; `INBOX.md` HC-B64 and HC-B65 to Done, and a request for DEC-420 (4), (7)
  and (9) (no cast in the air: the second of #183 and #123; the Fury dash on Q and one movement
  path: the second of #183 and #136), with the traps and the open knock-up question; status notes
  in architecture 03 and 10; the Fury dash row and note in `09-controls.md`; OQ-18 in
  `12-open-questions.md` (dash decided). Critic round 3 (`critic-3.md` in the agent folder):
  request-changes, no blockers; S1 to S4 and N1 to N6 fixed, N7 and N8 (optional) not done.
- Checks run: `npm run check` → `EXIT 0` (2026-11-27 10:32Z to 10:42Z, HEAD 50e41b2e plus
  the working tree, `git stash create` 7768853e). Format, no-js, lint, typecheck, knip and build
  passed. Core: `Test Files 322 passed (322)`, `Tests 1957 passed (1957)`.
  Protocol: `Test Files 1 passed (1)`, `Tests 33 passed (33)`.
  Client: `Test Files 335 passed (335)`, `Tests 2281 passed (2281)`.
  Server: `Test Files 29 passed (29)`, `Tests 165 passed (165)`.
  Docs: `Checked 219 Markdown files under docs/.` `Documentation check passed.`
  Fail-first: 3 breaks, all red (the stun and the countdown-hold cases in `JumpSystem.test.ts`,
  the slow test in `MovementSystem.test.ts`). That check ran before the critic 3 fixes; the final
  check is below.
- Final check after the critic 3 fixes: `npm run check` → `EXIT 0` (10:47Z to 10:57Z, HEAD 50e41b2e plus the
  working tree, tree 0c44bdae the same at start and end). Core: `Test Files 322 passed (322)`,
  `Tests 1958 passed (1958)`. Protocol: `Tests 33 passed (33)`. Client:
  `Test Files 335 passed (335)`, `Tests 2281 passed (2281)`. Server: `Tests 165 passed (165)`.
  Docs: `Checked 219 Markdown files under docs/.` `Documentation check passed.`
- Next step: the coordinator runs the DEC-420 push script (fast-forward of `feat/legend-jump`,
  PR body update); then PR #183 can merge.
