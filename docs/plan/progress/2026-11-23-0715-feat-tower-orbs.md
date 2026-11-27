---
title: 'Progress 2026-11-23: feat/tower-orbs (DEC-342 tower orbs and the arc shot)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the lane towers shoot orbs, and the arc shot of DEC-341 (4) is built for the wall turret bolts and the orbs (DEC-342).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/tower-orbs (DEC-342 tower orbs and the arc shot)

Phase 4 / sprint 4.2 · feat/tower-orbs · sholtzman + Claude Code (PR-REVIEW-ASSIST-40 to -43)

- What was done: the lane towers (spawner and buff) shoot orbs through the wall turret's ammo
  path (`lane-tower` profile, `tower-orb` ammo, DEC-302). The arc shot of DEC-341 (4) is built
  for the turret bolts and the orb, and the orb bursts in a splash (DEC-342); the client draws
  the arc, the shadow and the blast. The orb numbers are option A of HC-Q96 to HC-Q100, `TUNE`.
  Critic rounds 1 to 3 (round 3 approves): fixes and better-than-design items in DEC-362
  (sign-off: INBOX HC-B42); ponytail: 3 comment cuts. Merged `feat/wall-turrets` `da6bba6b`.
  Docs: DEC-342, DEC-362, INBOX, architecture 02, 05 §10, 07 §5 and §13, 10 §7 and §12, 11 §10,
  balancing.md.
- Checks run: `npm run check` on the working tree of the round-3 commits, before this line was
  filled in → `EXIT=0` (format "All matched files use Prettier code style!", core 378 files /
  2517 tests, protocol 1 / 31, client 316 / 2225, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/tower-orbs/check-5.log`). Pre-commit hook (`check:quick`) on each commit.
- Next step: the push script through the coordinator. The PR does not merge before the owner
  answers HC-Q96 to HC-Q100 and the card "ORB flight over cliffs".
