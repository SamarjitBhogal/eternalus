---
title: 'Progress 2026-11-27: feat/wall-turrets (critic DEC-388 round 1 fixes, DEC-396)'
description: 'Phase 3, sholtzman + Claude Code: PR #163 renumbers DEC-375 and DEC-376 to DEC-388 and DEC-389, renames carry to mount, adds the attack-command test, and builds the owner answer HC-Q120 (pylon health 2,000, DEC-396).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/wall-turrets (critic DEC-388 round 1 fixes, DEC-396)

Phase 3 · feat/wall-turrets · sholtzman + Claude Code (fix brief from PR-REVIEW-ASSIST-49, addendum
from PR-REVIEW-ASSIST-50)

- What was done: (1) The decisions log numbers DEC-375 and DEC-376 became DEC-388 and DEC-389,
  because phase/3 uses the old numbers for other rows. Code comments, tests, docs and INBOX moved
  with them. (2) Critic B2: "carry" became "mount". A structure is mounted on its map object
  (`isMounted`, `mountOf`, `mountedHealth`), so the name does not clash with the planned `Carry`
  component. (3) Critic S1: two `Simulation` tests send real `attack-target` commands. A melee
  Legend hits the turret and its pylon. A ranged Legend hits only the turret. (4) Critic S2 and
  N1 to N4: the #98 merge note and the HC-Q120 INBOX item are in the DEC-388 row. (5) Owner
  answer HC-Q120 (Owner Calls v103, DEC-396): the pylon has 2,000 health, the same as a wall
  segment. A third test shows a pylon that stays as a ruin after its turret falls.
- Checks run: the full check runs on this head after this entry
  (`eternalus-agent-work/wall-turrets/dec388-fix-check-1.log`). Fail-first rows 15 and after are in
  `eternalus-agent-work/wall-turrets/dec375-fail-first.md`.
- Next step: the critic re-checks the delta; then push through the coordinator.
