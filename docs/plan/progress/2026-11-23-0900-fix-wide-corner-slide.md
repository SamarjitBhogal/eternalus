---
title: 'Progress 2026-11-23: fix/wide-corner-slide (HC-B33: a unit stops dead in a wide corner)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: CollisionResolver slides what is left of a move off every wall it met at once, with the slide helper that Momentum uses (DEC-330, HC-B33 option A).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: fix/wide-corner-slide (HC-B33: a unit stops dead in a wide corner)

Phase 4 / sprint 4.1 · fix/wide-corner-slide (from `feat/class-passives` bf34cfcd, a PR into it)
· sholtzman + Claude Code

- What was done: the HC-B33 fix, the owner's answer "A: fix it in a small PR before PR 8 merges"
  (DEC-330). The branch stacks on `feat/class-passives` (PR #157) because the fix shares its slide
  helper with `Momentum`, which only that branch has.
  - New `utils/slideOff.ts` (`slideOffInto`): the vector closest to a move or a velocity that runs
    into none of the given walls (a frictionless contact). It is `Momentum.slideOff` and
    `Momentum.isClear`, moved out unchanged, in the `*Into` form of `utils/vec2.ts`. It lives in
    `utils/` because `components/` may not import `physics/`.
  - `CollisionResolver.slide`: at each wall a move meets, what is left of the whole move slides off
    every wall that the move has met so far, at once. Before, the rest of the move slid off each
    wall in turn, so in a corner wider than 90° a unit moved a hair out along one wall and back
    every tick. `Momentum.shed` and `Momentum.aim` call the helper; `Momentum` has no slide code of
    its own now.
  - Docs: 10 §7 gets the rule for several walls in one move; 10 §12 drops the "known defect" text
    and states the rule as built; `INBOX.md` HC-B33 records the build.
  - Tests: `CollisionResolver` (a mover pressed into a 120° and a 135° corner, 0.2 m and 0.6 m a
    move, touches both faces and does not move), `CollisionSystem` (a Sentinel that steers into a
    120° or 135° corner stops, and for the last 2 s of 6 s the move it tries points along its
    heading every tick), `slideOff` (the helper on its own). Red before the fix: the 5 new
    resolver and system tests fail with the old `CollisionResolver.ts` put back
    (`eternalus-agent-work/abilities/hc-b33/red-2-old-resolver.out`). After the correctness
    critic: a resolver test that a move which meets both faces of a 150° bend ends where 256
    small steps of it end. It fails with `left = 1 - contact.time` (0.41 m off) and with the old
    resolver (`hc-b33/red-3-mutant-share.out`, `red-4-old-resolver-share.out`).
  - Critic round 1: architecture approve, no blockers (`hc-b33/critic-architecture-r1.md`);
    correctness no blocker (`hc-b33/critic-correctness-r1.md`); ponytail comment cuts only
    (`hc-b33/ponytail-hc-b33.md`). Not fixed, with a `ponytail:` comment in
    `CollisionResolver.slide`: a wall the slide has left (round a column) still limits the rest
    of that move, so a fast move can stop a tick early at the next wall (7 of 8,598 moves of
    two or more contacts on a generated map, all 1.2 m moves; the old code was worse in 1,555).
  - Probe (`hc-b33/zzProbeHcb33.test.ts.txt`, 20 s, heading 30° into the corner): before, the
    Sentinel's facing swung by more than 10° 516 times (120°) and 387 times (135°) and never
    settled; after, it settles by tick 93 (120°) and tick 119 (135°) and then faces one way. A push
    (3 m over 15 ticks) into the corner moved it up to 6.8 cm (120°) and 7.7 cm (135°) a tick
    before; after, it does not move (`probe-3-before.txt`, `probe-3.txt`, `probe-4-push-*.txt`).
    On arrival, the Sentinel's run along one face can carry it a little out along the other face,
    and its heading brings it back: that is its momentum, not the defect.
- Checks run: `npm run check` on the final tree → EXIT=0 (`hc-b33/check-r2.log`): format, no-js,
  lint, typecheck, knip, tests (core 352 files / 2253 tests, protocol 31, client 2202, server 85),
  build, "Documentation check passed."
- Next step: the critic round, the commit, the push script to the coordinator; after PR 8's
  follow-up is pushed, open this PR into `feat/class-passives`. Then HC-B28 on #149 (DEC-336) and
  the W3 and W4 hits after HC-Q101 to HC-Q103.
