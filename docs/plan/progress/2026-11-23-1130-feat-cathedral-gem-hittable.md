---
title: 'Progress 2026-11-23: feat/cathedral-gem-hittable (#132 R6: DEC-346)'
description: "Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: the owner's five gem answers (DEC-346) built for #132 R6 O1 to O5: the gem blocks movement, no touch strike, kill credit to the last enemy damager, the two tidy-ups."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/cathedral-gem-hittable (#132 R6: DEC-346)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: swholtzman's R6 on #132, after the owner answered the five gem cards.
  - O1: decisions-log batch 2026-11-23 with DEC-346 (the five answers verbatim, what each changes,
    the DEC-292 parts it replaces); `INBOX.md` closes the "four rules" item and both tidy-up items
    and adds the owner's camp question; architecture 07 (gem row, implementation status) and 05 §9
    (kill credit) updated.
  - O2: the Cathedral furnishing moved from `MapBuildingInteriorBuilder` (316 → 101 lines) to its
    own `CathedralInteriorBuilder`. The built presentation and map objects for seeds 1, 7, 42, 1234
    and 99 999 were byte-identical before and after (SHA-256 `51dd8db4…` both times), checked
    before the plinth was added.
  - O3: camps and the gem share one `NEVER_DAMAGED` spread in `structureCatalogue.ts`.
  - O4: the touch strike and `gem-warded` are gone; a hit with an attacker still strikes. An
    unbreakable plinth (`cathedral` map object, no health) of the gem's radius stands under it, so
    collision and the lane paths go round it. Tests: a unit walking into the gem from each side
    stops at its edge; a unit standing against it is never struck; a Warrior walked into it in a
    full simulation stops and is not struck. `cathedralEntrances.test.ts` now allows only the
    plinth on the door-to-door line and checks a parallel line south of it is clear;
    `Simulation.duel.test.ts`'s scripted walker steps round the gem (assertions unchanged); the
    Duel gem test now hits the gem instead of standing on it. The opening-horde march to the first
    objectives (`Simulation.flowFields.test.ts`, middle lane included) passes.
  - O5: `KillCredit` (called by `DamagePipeline`) records each unit's last enemy hit
    (`LastEnemyHit`, hashed) and, when the gem's statuses kill, names that enemy as the killer if
    its hit landed within the 30 s assist window. Tests: the enemy Legend hit 10 s before gets the
    kill and 15 points; after the window nobody does; an enemy minion's last hit takes the credit
    (no Legend kill, the Legend keeps its assist); an ally's hit gives none; other killers are
    unchanged; kill XP 175 vs 0; the hash changes with each field.
  - Every new test was red before its code (missing module or failing assertion).
- Checks run: `npm run check` (Windows, Node from nvm) on the working tree, after two Duel test
  walkers were taught to go round the gem (core `Simulation.duel.test.ts`, server
  `CoreDuelSimulation.test.ts`) and the two-kill Duel test given a 180 s timeout (about 25 s, over
  60 s under coverage):

  ```
  Test Files  287 passed (287)   Tests  1727 passed (1727)   [core]
  Test Files  1 passed (1)       Tests  29 passed (29)       [protocol]
  Test Files  304 passed (304)   Tests  2084 passed (2084)   [client]
  Test Files  26 passed (26)     Tests  114 passed (114)     [server]
  built (client, server)
  Documentation check passed.
  EXIT=0
  ```

- Next step: push, then swholtzman and claudiodh re-review #132. Not built here: the owner's Duel
  design (circle strike, laser, "using it as a weapon" credit), a follow-up PR once the six "GEM
  duel" cards are answered. When #148 lands, a shot aimed at the gem must reach the gem's circle
  before the plinth (architecture 07 status note).
