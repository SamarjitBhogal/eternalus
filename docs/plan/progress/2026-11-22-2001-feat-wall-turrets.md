---
title: 'Progress 2026-11-22: feat/wall-turrets (PR 4 pre-PR gate)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: PR 4 wall turrets through critic rounds 1 to 3 and the ponytail review; a shot whose owner is gone still runs its attack onHit; checks green.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/wall-turrets (PR 4 pre-PR gate)

Phase 4 / sprint 4.2 · feat/wall-turrets · sholtzman + Claude Code (PR-REVIEW-ASSIST-33 to -35 and their runners 5 to 7)

- What was done: the pre-PR gate on `dac919a7`. Critic round 1 fixes `b0384642` (line of fire,
  `LegendHitLog`, `TurretAmmoRule`, DEC-335) and the launch-point edge fix `161e10d4` (DEC-334
  addendum). Round 2 fixes `8744c137` (hash `LegendHitLog`, golden replay `abilityCastsSeed11`
  350-450 regenerated, mob `onHit` type, line of fire with the chosen ammo) and `d16ab90e`: a shot
  whose owner is gone still runs its attack's own `onHit` (S4, DEC-335 correction (d)). Round 3
  fixes `0608c822`. Ponytail: 5 cuts applied, 5 rejected. Fail-first 70 to 107
  (`eternalus-agent-work/wall-turrets/fail-first.md`). Open owner cards: HC-Q90 to HC-Q95, HC-B36.
- Checks run: `npm run check` → `EXIT=0` (core 371 files / 2466 tests, protocol 1 / 31, client 315 /
  2209, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/wall-turrets/check-7.log`, on the tree of this commit).
- Next step: push `feat/wall-turrets` and open PR 4 on base `feat/melee-sweeps` (#159), through the
  coordinator. The red commit `7ed1ae87` needs a squash merge or a note in the PR text.
