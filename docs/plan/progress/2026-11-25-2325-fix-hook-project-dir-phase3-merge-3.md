---
title: 'Progress 2026-11-25: fix/hook-project-dir (third phase/3 merge)'
description: 'Harness / process, sholtzman + Claude Code: merged phase/3-sprint-3-work (67dbae61: #83, #104, #131, #118, #128, #142, #145, #132) into fix/hook-project-dir, because phase/3 moved before the second merge was pushed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: fix/hook-project-dir (third phase/3 merge)

Harness / process · fix/hook-project-dir (PR #155) · sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `67dbae61` (#83, #104, #131, #118,
  #128, #142, #145, #132) into the branch. The second merge (`02634ced`, phase/3 at `1145cf6b`)
  was not pushed before phase/3 moved, so PR #155 conflicted again. Three conflicts, each new
  text at the same place:
  - `INBOX.md`: HC-B31 here, the PR #145 items on phase/3; kept both.
  - `docs/process/guardrails.md`: `last-reviewed`; kept phase/3's later date.
  - Decisions log: kept all batches, phase/3's 2026-11-23 batches (DEC-348, DEC-349) first, then
    DEC-352 and the DEC-331 batch from this branch.
  - A diff of the result against phase/3 shows only this branch's lines. A diff of the three
    files against the branch shows only phase/3's lines. phase/3 brings one dependency line
    (`vite` in the root `package.json`); this branch adds none.
  - This entry is part of the merge commit, so that the commit hook runs one time (the machine
    load was high).
- Checks run: see the verbatim `npm run check` result in the PR description.
- Next step: the owner runs the push script; PR #155 then needs a new approval, because the
  merge commits are new.
