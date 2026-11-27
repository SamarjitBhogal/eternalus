---
title: 'Progress 2026-11-27: fix/corner-boss-levels (DEC-402, DEC-403)'
description: 'Phase 3 / owner answers v103, Sam Holtzman + Claude Code: the corner boss levels like the other neutral mobs (DEC-402, HC-B58); the Cathedral gem zone match by map feature is recorded for the next gem PR (DEC-403, HC-B47).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: fix/corner-boss-levels (DEC-402, DEC-403)

Phase 3 / owner answers v103 · fix/corner-boss-levels (from `phase/3-sprint-3-work` at
`e8250d6b`) · Sam Holtzman + Claude Code (GAME-LOOP-AND-POST-GAME-71, -72)

- What was done: the owner's answer on HC-B58 ("A: the corner boss levels, like the other
  neutral mobs") is DEC-402. The `corner-camp` guard plan in `content/structures/guardPlans.ts`
  now has `canLevel: true`, so the corner boss gains veteran levels and the rally aura as the
  forest-camp mobs and the capture point boss group do. This changes DEC-376 (d); the DEC-376 row
  and its INBOX _Done_ entry point to DEC-402. The owner's answer on HC-B47 ("A: build it in the
  next gem PR") is DEC-403: no code change on this branch. Architecture 18 (the minion XP rules
  and the M6c paragraph) and the `VeterancySystem.isLeveller` TSDoc name DEC-402.
- Red first: `guardPlans.test.ts` expected `corner-camp` in the levellers list while the plan
  still had `canLevel: false`: `Tests 1 failed | 5 passed (6)`. With `canLevel: true`:
  `Tests 6 passed (6)`.
- Checks run: see the PR description (the `npm run check` result, the critic and ponytail).
- Next step: after #129 merges, merge phase/3 into this branch and move INBOX HC-B47 (it is on
  #129 only) to _Done_ with "Decision: DEC-403".
