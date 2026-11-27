---
title: 'Progress 2026-11-27: feat/cathedral-eruption-boss (R6 S1: the eruption blast is lethal)'
description: 'Phase 3 / Cathedral, swholtzman reviewer + Claude Code: DamagePipeline.kill deals a unit its whole health past every damage step, so the gem eruption kills every unit in the Cathedral, horde minions too (DEC-371 "BOSS guards" C).'
audience: [humans, agents]
status: active
owner: Aryan976503
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/cathedral-eruption-boss (R6 S1: the eruption blast is lethal)

Phase 3 / Cathedral · feat/cathedral-eruption-boss (PR #160), on `6858c960` · swholtzman
reviewer (PR-REVIEW-90_91-21) + Claude Code

- What was done: fixed R6 **S1**. The blast dealt `health.total` through `DamagePipeline.apply`,
  so `MinionStrengthStep` divided it by a horde minion's strength (up to 1.5) and a minion on its
  own half of the lane lived. A `damageTaken` status below 1 would do the same.
  - `DamagePipeline.kill(state, targetId, source)` deals the target's whole health, shields
    included, past every step. It emits the same `damage-applied` and `entity-died` events and
    asks `KillCredit` the same way as a lethal `apply`. Both call one private `hit` (the old
    `apply` body): `apply` with the steps, `kill` with `Number.MAX_VALUE` and no steps
    (`Health.applyDamage` takes only what the shields and health hold). The pipeline stays the
    only caller of `Health.applyDamage`.
  - `GemEruptionSystem.blast` calls `kill`. The blast stays no team's (the source is still
    `environment` / `gem-eruption`, which `KillCredit` never credits).
  - Doc 05 §9 implementation status names `kill`. The `INBOX.md` blast item and doc 07 already say
    every unit dies, so they do not change. New `INBOX.md` item: "Better than design: the blast's
    'kill' hit in the damage design" (the critic's suggestion, for Sam).
- Tests: `GemEruptionSystem.test.ts` "kills a horde minion on its own half of the lane" (a light
  minion at x 55 on `TWO_LANE_MAP` lane-0, strength about 1.28) failed before the fix ("expected
  false to be true"). `DamagePipeline.test.ts` "kills with one hit no step can change" covers
  `kill` with a step that blocks every hit, a 0.1 shield over 64 health (a hit of `health.total`
  takes only 63.99999999999999 of the 64) and the `entity-died` killer. Deliberate breaks: `kill` running
  the steps turns it red (1 failed); `kill` dealing `health.total` turns it red ("amount":
  63.99999999999999). The system test guards the original bug (the blast through `apply`).
- Critic (`architecture-reviewer`): approve, no blockers, no should-fix. Its nits are applied (the
  float test, the killer assertion, the TSDoc warning that `kill` skips breakability and friendly
  fire). Follow-up outside this PR: `MapDestructionSystem` kills a building's contents with
  `apply(health.total)`, the same pattern (reported to the coordinator).
- Ponytail: one cut, applied. `apply` and `kill` share one private `hit(…, steps)` instead of two
  helpers (`DamagePipeline.ts` is +24 lines against `6858c960`, not about +60).
- Checks run: see the PR #160 comment (`npm run check` on this head).
- Next step: the push script goes to the coordinator; then #164 merges this head.
