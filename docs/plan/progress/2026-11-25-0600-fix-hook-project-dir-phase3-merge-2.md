---
title: 'Progress 2026-11-25: fix/hook-project-dir (second phase/3 merge)'
description: 'Harness / process, sholtzman + Claude Code: merged phase/3-sprint-3-work (1145cf6b: #91, #130, #107, #100, #109) into fix/hook-project-dir after the approval, because the PR conflicted with phase/3.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: fix/hook-project-dir (second phase/3 merge)

Harness / process · fix/hook-project-dir (PR #155) · sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `1145cf6b` (#91, #130, #107, #100,
  #109) into the branch as `02634ced`. PR #155 had an approval (claudiodh, on `e64dedfd`) but
  conflicted with phase/3. Two conflicts, both new text at the same place. `INBOX.md`: HC-B31
  here, the BUG-4 developer-menu items on phase/3; kept both. Decisions log: kept phase/3's
  `last-reviewed` and both 2026-11-23 batches (DEC-355 from phase/3, then DEC-352 and the
  DEC-331 batch from this branch). A diff of the result against each parent shows only the
  other side's lines. No change to `package.json` or `package-lock.json`.
- Checks run: see the verbatim `npm run check` result in the PR description.
- Next step: the owner runs the push script; PR #155 then needs a new approval, because the
  merge commit is new.
