---
title: 'Progress 2026-11-22: feat/class-passives (pre-PR gate round 2 fixes)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: Wrecking Run reads the contact normals of each wall, slides off them as a frictionless contact, hashes them, and builds along a slanted wall from rest; HC-B29 card fixes, HC-B33.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/class-passives (pre-PR gate round 2 fixes)

Phase 4 / sprint 4.1 · feat/class-passives (from `feat/ranged-attacks` 9cb3a31e) · sholtzman + Claude Code

- What was done: the fixes from pre-PR gate round 2 (correctness critic F1-F3, architecture critic
  M1, M2 and nits 1-9) and from a probe of those fixes (D1, D2).
  - Contact normals: `CollisionResolver.move` fills an optional list with the unit normal of each
    wall and map edge that the move touched. `CollisionSystem` gives that list to
    `Movement.hitBlock`. This replaces the one summed loss per move, which blended two walls in a
    corner and let a Sentinel build false speed while a push held it in a corner (F1, F2).
    `BLOCK_EPSILON` and `components/Momentum.constants.ts` are gone.
  - `Momentum.slideOff`: the vector closest to the wanted one that runs into none of the touched
    walls (a frictionless contact). A corner stops the unit, also a corner wider than 90° (D1:
    sliding off each wall in turn left a part that pointed out of the corner).
  - Brake guard: a backward part shorter than `CONTACT_EPSILON` is roundoff from a wall, so it does
    not brake. Before, a Sentinel at rest against a slanted wall never built along it (D2).
  - The touched walls are hashed (`Movement.wallNormals`, a `walls` field in `StateHasher` only
    while there are some), and `Movement.stop` forgets them (M1).
  - Known limit, not fixed: `CollisionResolver.slide` also slides off each wall in turn, for every
    unit. In a corner wider than 90° a Sentinel's facing flips while it stays in place, and other
    units shake by about 5 cm (D3). It is shared physics, so it is `INBOX.md` HC-B33 for the owner
    to schedule.
  - Docs: 10 §12 note rewritten (contact normals, `slideOff`, brake guard, hashed walls, the D3
    limit, parts numbered as HC-B29, the F3 card, the ramp duration named by file). `INBOX.md`
    HC-B29: the full cost of the one-limit alternative (M2), the classes doc named and quoted,
    and part (3) asks to depart from the standing rule. The `sentinel.ts` comments and the phase-4
    status line say a head-on hit stops the Sentinel and it builds along a wall.
  - Breaks B25 to B34 all went red (work folder `breaks-r3b.out`, `breaks.log`).
- Checks run: `npm run check` → EXIT=0 (core 2230, protocol 31, client 2202, server 85 tests;
  `Documentation check passed.`).
- Next step: commit, pre-PR gate round 3 (the last), then the push script to the coordinator.
