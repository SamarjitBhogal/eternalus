---
title: 'Progress 2026-11-27: feat/legend-jump (DEC-390)'
description: 'Phase 3 / sprint 3 work, sholtzman + Claude Code: a Legend jumps on Space, with momentum, a ground shadow and a held re-jump; DEC-390; Owner Calls HC-Q123 to HC-Q129; INBOX HC-B64, HC-B65.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/legend-jump (DEC-390)

Phase 3 / sprint 3 work · feat/legend-jump · sholtzman + Claude Code

- What was done: Space jumps (DEC-390). Core: `jump` command, `Jump`, `JumpSystem` (arc in ticks,
  takeoff momentum, re-jump on landing while Space is held), numbers in
  `content/legends/legendJump.ts` (`// TUNE:`); collision does not change. Snapshot
  `jump: { height } | null`. Client: `InputAction 'jump'`, no jump inside an open modal,
  `AirborneView` (raised Legend, ground shadow, height interpolated). Online Duel carries
  `isJumping`. Docs: DEC-390 row (point 5: units do not block units yet), Jump row in
  `09-controls.md`, status notes in architecture 03, 04, 08, 09, 10, 13. Open with built
  defaults: HC-Q123 to HC-Q129; critic items HC-B64, HC-B65 in `INBOX.md`.
- Checks run: `npm run check` → `EXIT 0` (2026-11-27 09:04Z, staged tree bd64d13b).
  Format, no-js, lint, typecheck and knip passed.
  Core: `Test Files 322 passed (322)`, `Tests 1952 passed (1952)`.
  Protocol: `Test Files 1 passed (1)`, `Tests 33 passed (33)`.
  Client: `Test Files 335 passed (335)`, `Tests 2281 passed (2281)`.
  Server: `Test Files 29 passed (29)`, `Tests 165 passed (165)`.
  Build passed. Docs: `Checked 210 Markdown files under docs/.` `Documentation check passed.`
  Fail-first: 52 breaks, 51 red; `StateHasher.test.ts` catches the green one (jump fields not hashed).
- Next step: the coordinator runs the push script and opens the PR into `phase/3-sprint-3-work`;
  Sam answers HC-Q123 to HC-Q129, HC-B64 and HC-B65.
