---
title: 'Progress 2026-11-27: chore/wall-turrets-fold (#163 + #168 + U1 fold)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the wall-turrets fold merges #168 with its speed fix and the U1 head into feat/wall-turrets; an arc shot lands only on the polygons a straight shot stops on; full npm run check passed on this tree.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: chore/wall-turrets-fold (#163 + #168 + U1 fold)

Phase 4 / sprint 4.2 · chore/wall-turrets-fold (local; lane A pushes the player stack) ·
sholtzman + Claude Code (PLAYER-STACK-FOLD-3, -4 and -5)

- What was done: the fold joins three heads on `feat/wall-turrets` (#163, `7c07c487`):
  `957bbe1d` merges `fix/tower-orbs-windows-timeout` (#168 with the speed fix and DEC-400),
  and `98994bbb` merges the U1 head `8c1a4419` (#169, #181, #182, DEC-407..409). The commit
  messages of both merges list every conflict rule and every edit git did not flag. The main
  ones: `structureBodiesOf` returns `mountId`, so a wall turret's pylon keeps its own health
  (DEC-388) next to U1's many body objects per structure (DEC-386 (1)); `WorldObjectStore`
  keeps the lazy grid and ruins a structure's body objects and its mount through one `leave`.
- Fix after the critic: an arc shot lands on an outline only on the polygons a straight shot
  stops on (`ArcLanding.isUnder` uses `AreaHitQuery.shotPolygonsOf`), so both kinds of shot
  follow one rule (architecture 05 §10, "lands on the body under it that a straight shot would
  stop on"). Nothing changes in play today: every shipped outline is all walk-on, all
  shots-cross or all solid. Three nits: `tower-orb` in the "no `litOnHit`" test, two comments.
- Docs edited: INBOX HC-B70 (two better-than-design items from the critic, sign-off asked).
- Checks run: the new `ArcLanding` test failed before the fix (1 failed, 2 passed: the shot
  landed on the walk-on floor). Pre-PR critic (`architecture-reviewer`) on the remerge diffs
  of `98994bbb` and `957bbe1d`: ready, no blockers; S1 and the nits fixed here; S2 is this
  entry. Ponytail review of the merge resolutions: lean, no cuts. Full `npm run check` on this
  tree passed (exit 0) before this commit; this commit is made only when it passes. Log:
  `eternalus-agent-work/abilities/fold-plan/u2/npm-check-fold-tip.log`.
- Next step: lane A merges this tip into the U4 fold and pushes the stack; HC-B70 waits for
  Sam.
