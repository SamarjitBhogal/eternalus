---
title: 'Progress 2026-11-23: feat/map-work-forts-towers (no mountain on the Stronghold wall, DEC-340)'
description: 'Phase 3, sholtzman + Claude Code: HC-Q95 option B. A corner mountain that touches the Stronghold wall, a gate or a wall turret is drawn smaller until it is clear.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/map-work-forts-towers (no mountain on the Stronghold wall, DEC-340)

Phase 3 / map work · feat/map-work-forts-towers · sholtzman + Claude Code (PR-38-HELPER-51, PR-38-HELPER-52)

- What was done: the owner chose HC-Q95 option B ("make that mountain smaller"). The corner
  mountains at each end of the Stronghold wall grew over the end turret.
  - `utils/geometry.ts` has `doPolygonsOverlap` (two polygons share any point).
  - `MapSceneryBuilder` gives `MapMountainBuilder` the footprints of the wall's features
    (`WALL_RING_KINDS`: gate, wall segment, turret), in sketch units, through its constructor.
  - `MapMountainBuilder` draws each mountain at the largest of 10 size steps whose blocking mass
    is clear of every footprint. A mountain that is not clear at its smallest step is left out.
  - Docs: `INBOX.md` HC-Q95 closed, DEC-340 in the owner decisions log, and a 2026-11-23
    amendment in `docs/architecture/06-map-and-minimap.md`.
  - Critic (`architecture-reviewer`, no blockers) fixes applied: the wall test also runs on a
    2000 × 900 world (x and y scale differ); `keepClear` is a constructor parameter; every
    footprint piece of a mountain is checked; the unit test proves the largest clear step (40 %);
    one `wallFootprints()` helper and a private `toSketch`.
  - Rejected critic items, with reasons: `SIZE_STEPS` stays a private static member (one number,
    not a module constant); `doesPolygonOverlapRect` is not folded into `doPolygonsOverlap` (the
    MatchGrid hot path keeps the cheaper rectangle test, and it is a drive-by).
  - Critic BTD-2, built under the owner's standing rule (PR-REVIEW-COORDINATION-33 ruled to build
    it in #152): `MapSceneryBuilder` converts each feature footprint to sketch units in its
    constructor, with the feature position, so its sketch copy of the map uses one unit. The
    mountain keep-clear areas read the wall footprints from that copy. DEC-358; sign-off card
    `INBOX.md` HC-B37.
- Checks run: break-first script `eternalus-agent-work/dec-288/hc-q95-breaks.sh` (log
  `hc-q95-breaks.log`): 8 breaks (a)-(h) all red, restore 22/22 green; break (h) proves HC-B37.
  `npm run check`: log `eternalus-agent-work/dec-288/hc-q95-check-4.log`.
- Next step: push this branch with #156 (one script through the coordinator), then PR 9b.
