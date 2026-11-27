---
title: 'Progress 2026-11-22: feat/class-passives (pre-PR gate round 3 fixes)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: Wrecking Run reaches top speed on every heading and along every wall (ramp stall fix); ponytail cuts; HC-B33 rewritten as a defect with options A and B; HC-B29 parts lead with the player.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/class-passives (pre-PR gate round 3 fixes)

Phase 4 / sprint 4.1 · feat/class-passives (from `feat/ranged-attacks` 9cb3a31e) · sholtzman + Claude Code

- What was done: the fixes from pre-PR gate round 3, the last round (architecture critic: pass,
  0 blockers, M1 and nits 1-7; correctness critic: one high, two low; ponytail: 3 cuts).
  - Ramp stall (correctness, high): on many headings (a diagonal, 3°, 4°, 6° and more) and along
    about 3 in 10 slanted walls, the Sentinel stayed at walk speed (3.5 m/s) for ever. Roundoff
    put its speed along a unit heading a hair below `walkSpeed`, so `Momentum.buildUp` capped it
    at walk speed every tick and the ramp never started. A speed within `CONTACT_EPSILON` below
    `walkSpeed` now counts as walk speed. Two new tests sweep every heading in 1° steps and every
    wall angle in 1° steps; both were red on the old line (breaks B35 and B36). The first ramp
    test now drives 35 ticks, not 36: in exact arithmetic 35 ticks at 3 m/s² land on 3.5 m/s.
  - Ponytail cuts 1-3 with architecture nits 1 and 5: `Momentum.shed` keeps the resolver's
    normal objects (no copy); `Movement.wallNormals` returns one shared empty list for a unit
    without momentum; the `sentinel.ts` TSDoc and the phase-4 status line are reflowed. The grip
    comment keeps its DEC-307 quote (architecture nit 7 outranks the ponytail cut).
  - TSDoc: `CollisionResolver.move` lists the walls in the order the slide met them, then the
    bounds edges; `reach` is read-only like `move` apart from `move`'s `contacts` list; `slide`
    names the wide-corner defect and `INBOX.md` HC-B33. `Momentum` says "a press into a corner
    stops it" (correctness, low 2: running along a wall into a corner wider than 90°, it turns
    along the second wall).
  - `INBOX.md` HC-B33 is now a defect (architecture M1, nit 7; correctness, low 3): PR 8 adds the
    Sentinel's facing swing (37° to 68°, 11 to 16 times a second, every tick at 150°) and the
    jump of about 15 cm a tick under a push into the corner. Options: (A) fix the wall code in a
    small PR before PR 8 merges (recommended, DEC-223), with one slide helper shared with
    `Momentum` (BTD-6); (B) after PR 8. A `docs/plan/bugs.md` row waits for a Jira task.
  - `INBOX.md` HC-B29 parts (1) to (3) lead with what the player sees; code names come last
    (architecture nit 4). 10 §12: "a press into a corner", "a quick slide (`grip`)" (nit 3), and
    the HC-B33 note says PR 8 adds the Sentinel part.
- Checks run: `npm run check` → EXIT=0 (core 2232, protocol 31, client 2202, server 85 tests;
  `Documentation check passed.`).
- Next step: commit, the PR 8 body and the push script to the coordinator; the coordinator sends
  the new HC-B29 and HC-B33 cards to the owner.
