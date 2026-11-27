---
title: 'Progress 2026-11-27: feat/legend-level-damage (DEC-422 recorded, phase/3 merge)'
description: "Phase 3: recorded the owner's HC-Q130 answer (DEC-422, ability hits on structures, docs only) and merged phase/3-sprint-3-work at 8ad77bfd (#129, #149, #177) into feat/legend-level-damage."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/legend-level-damage (DEC-422 recorded, phase/3 merge)

Phase 3 / sprint 3 work · feat/legend-level-damage (base `phase/3-sprint-3-work` 8ad77bfd) ·
WORKFLOW-FIXES-12 and WORKFLOW-FIXES-13 (Claude Code). The work before this is in the DEC-405
entry of 2026-11-27.

- What was done:
  - The owner answered Owner Calls card HC-Q130 (v108): "A: yes, ability hits on structures
    also use the lower rate — tuneable". Recorded as DEC-422: the decisions-log batch,
    architecture 05 §13 (the rule) and §18 (not built yet), and a sub-note on the `INBOX.md`
    DEC-36 item with one naming question (`perLevelOnStructures`). Docs only: ability damage
    (`DamageEffect`) is in `feat/ability-framework` (PR #123), not on this branch. The code is a
    small follow-up PR after both merge; the coordinator gave it to the WORKFLOW-FIXES sessions.
  - Merged `origin/phase/3-sprint-3-work` at `8ad77bfd` (#129, #149, #177). Three conflicts:
    the `ProgressionSystem` test helper now takes one rules object with both `hasMatchXp` and
    `legendsStartAtMaxLevel` (#177); the `INBOX.md` DEC-36 sub-notes stay in date order, before
    #177's HC-B46 item; the decisions log keeps both 2026-11-27 batches, DEC-406 above DEC-405.
    The merge commit message lists each one. The DEC-422 batch (v108, the newest) goes on top.
- Checks run before the commits: `npx vitest run src/systems/ProgressionSystem.test.ts` on the
  merge (30 passed) and `prettier --check` on the five changed files (passed). The full
  `npm run check` runs on the final head in the same gate hold, after this entry is committed;
  its verbatim result is in the PR description.
- Next step: push the branch and open the PR. If #98 merges first, merge phase/3 again (a
  decisions-log conflict only). After this PR and #123 merge, build the DEC-422 follow-up.
