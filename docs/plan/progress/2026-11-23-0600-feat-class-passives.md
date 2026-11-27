---
title: 'Progress 2026-11-23: feat/class-passives (PR 8 follow-up: the owner answers, DEC-330)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: a stun or slow takes away the Sentinel drive and it slides (card F3); HC-B29 signed off and written into 10 §2 and 05 §7; HC-B33 answered (option A); the DEC-330 row.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/class-passives (PR 8 follow-up: the owner answers, DEC-330)

Phase 4 / sprint 4.1 · feat/class-passives (from `feat/ranged-attacks` 9cb3a31e) · sholtzman + Claude Code

- What was done: the PR 8 follow-up for the owner's answers of 2026-11-23 (Owner Calls v68,
  DEC-330).
  - Card F3, "It slides: the stun or slow takes away its drive". A status now lowers only the top
    speed that `Momentum.drive` builds to (its new `top` argument). Speed above that top slides
    off at `grip`. A zero top (a stun) takes away the drive: the heading counts as zero, so all of
    the velocity slides off and the Sentinel does not press into a wall. `Movement.advance` caps a
    unit with momentum at `min(speedLimit, max(top, speed))`, so the drive never adds speed above
    the top and `limitSpeed` still cuts at once (DEC-314 (4)); `topSpeed` reports that cap, so the
    `FiniteTransformsInvariant` check (velocity ≤ `topSpeed`) holds. From 9 m/s a stun slides the
    Sentinel about 5.1 m in about 1.1 s; a slow (×0.7) bites in about 0.34 s.
  - New `Movement.hold()`: the countdown hold stops every unit at once, a unit with momentum too,
    and keeps its heading (the F3 card). `MovementSystem` calls it while `isIdleHeld` is set, in
    place of `advance(0)`.
  - Two effects that the F3 card does not name. (1) Every `cannot-move` status (a knock-up too,
    and Grab's hold until the Grab PR sets its own rule) takes the drive away as a stun does, and
    when `enraged` ends, the speed above `maxSpeed` slides off at `grip`: a reading, recorded in
    DEC-330 and 10 §12. (2) In the open, `Momentum.aim` now returns the top
    speed, not "no limit", so the part along the heading is clamped before the whole velocity is.
    In a turn at full speed this changes the Sentinel's velocity by up to about 2e-5 m/s
    against the base (the correctness critic's probe: 1220 of 270 000 ticks). No stored replay
    depends on the old values, because PR 8 has not merged.
  - Tests: `Momentum` (a stun slides to a stop and keeps the heading; a slow bites in about 0.3 s;
    no press into a wall while stunned; the cap), `Movement` (stun, slow, hold, `limitSpeed`
    still hard) and `MovementSystem` (a real stunned Sentinel at top speed slides about 5 m in
    about 1.1 s; the hold stops it at once). Breaks B37 to B42 each turned tests red and were
    restored (`eternalus-agent-work/abilities/pr8-passives/f3/breaks-f3.out`): B37 the old hard
    cap (3 red), B38 the hold through `advance(0)` (1), B39 a stun that keeps the heading (1), B40
    no limit in the open (2), B41 a soft `limitSpeed` (1), B42 a hold that keeps `topSpeed` (1).
    After the critic round: a test for the end of `enraged`; B43 (a cap of `min(limit, top)`, 4
    red, the new test among them) and B44 (a stun that zeroes the velocity inside `drive`, 4 red,
    the "though it steers on" test among them) (`f3/breaks-f3b.out`).
  - HC-B29 signed off (DEC-330): 10 §2 gets "Movement with momentum" (the two rates, steps 1 to
    4), "Movement rules" (one rule per unit; the Magus stances and the Harbinger flight are
    planned, post-MVP, as the owner asked "Please ensure this is, at least, documented") and the
    countdown hold sentence; 05 §7 says a passive can also be a block of movement numbers;
    `balancing.md` names the ramp `movementProfile.momentum.rampDuration`. 10 §12 states the F3
    rule, the sign-off and HC-B33 option A. `INBOX.md` HC-B29 and HC-B33 are answered.
  - The DEC-330 row (new batch at the top of the decisions log): the owner's words for W1 to W4,
    S1, S2, N1, P1, F3, HC-B29 (1) to (3) and HC-B33, with the Shield Wall note of W3 in full
    (lane B builds it in PR 6), and which PR builds each part. `sentinel.ts`: the W1 and W2
    numbers cite DEC-330.
- Critic round on this delta: architecture critic, pass with fixes (no blockers, no majors);
  correctness critic, low findings only; ponytail critic, pass, nothing to cut. Fixed: the checks
  line, the "Movement rules" text as a rule, the end of `enraged` (reading and test), the 10 §12
  heading and formulas, a break for the "though it steers on" test, the `FiniteTransformsInvariant`
  TSDoc, the `sentinel.ts` header wrap. Rejected: one shared zero vector in `utils/` (a literal,
  not shared knowledge; the two names mean different things in `commands/` and `components/`);
  the cap rule moved into `Momentum` (the cap is also `Movement.topSpeed`, which `Movement` owns;
  it moves with the movement-rule interface, which the owner put off, HC-B29 (3)).
- Checks run: `npm run check` → EXIT=0 (core 2241, protocol 31, client 2202, server 85 tests;
  `Documentation check passed.`). After the run, only this line changed.
- Next step: the critic on this delta, commits, the push script to the coordinator; then the
  HC-B33 wall-code PR (before PR 8 merges); the W3 and W4 hits after HC-Q101 to HC-Q103.
