---
title: 'Progress 2026-11-22: fix/hook-project-dir (phase/3 merge)'
description: 'Harness / process, sholtzman + Claude Code: merged phase/3-sprint-3-work (25f1151c: #111, #110, #103) into fix/hook-project-dir before its first push, because phase/3 moved on origin.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: fix/hook-project-dir (phase/3 merge)

Harness / process · fix/hook-project-dir · sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `25f1151c` (#111, #110, #103) into
  the branch. The push script stopped because phase/3 moved on origin from `e2a4fd66`. One
  conflict, in `INBOX.md`: both sides added a new item at the same place (HC-B31 here, the
  dependency audit on phase/3). Kept both. The rest is git's automatic merge. No change to
  `package.json` or `package-lock.json`.
- Checks run: see the verbatim `npm run check` result in the PR description.
- Next step: the owner runs the updated push script; the PR goes into `phase/3-sprint-3-work`.
  Owner call HC-B31 is still open.
