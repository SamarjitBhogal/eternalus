---
title: 'Progress 2026-11-27: feat/legend-level-damage structure rate (DEC-405)'
description: "Phase 3: a Legend's weapon hit grows with level at a lower rate on structures (the owner's HC-Q119 answer, DEC-405)."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/legend-level-damage structure rate (DEC-405)

Phase 3 / sprint 3 work · feat/legend-level-damage (base `phase/3-sprint-3-work` e8250d6b) ·
WORKFLOW-FIXES-9 to -11 (Claude Code). The work before this is in the 2026-11-27 merge entry.

- What was done:
  - The owner answered Owner Calls card HC-Q119 (v103, DEC-405): the full level rate on Legends,
    mobs and bosses, a lower rate on structures. `BasicAttackLevelStep` uses
    `levelScaling.basicAttackPerLevelOnStructures` when the target is a structure: an entity of
    the `structure` family, or a map object whose kind is in `STRUCTURE_MAP_OBJECT_KINDS`.
  - `content/maps/mapObjectDefinitions.ts`: an exhaustive table (`IS_STRUCTURE_MAP_OBJECT`, one
    `true` or `false` per `MapObjectKind`) gives the set, so each new map-object kind must choose
    (critic R2-BTD3; no behaviour change).
  - Each class gets 0.04 per level on structures (`TUNE`, a build default: the example in the
    card's option C). `LevelScalingRule` rejects a structure rate above the unit rate.
  - Docs: the DEC-405 row (with a "Derived, not asked:" sentence for the kinds that count),
    architecture 05 §9, §13 and §18, the 07 2026-10-27 note, and `INBOX.md` (the DEC-36 note,
    and the new better-than-design item HC-B63).
- Fail-first: eight breaks, each red and each restored by sha256
  (`eternalus-agent-work/legend-level-damage/breaks.log`): three on the step's structure test,
  two on `LevelScalingRule`, one on the pipeline wiring, and two on the table (`wall` set to
  `false`, `tree` set to `true`).
- Critic (`architecture-reviewer`): round 1 (opus) found blocker B1: walls, turrets, gates and
  the palace are map objects, not `structure` entities, so they took the unit rate. Fixed with
  the kind list. Round 2 (opus): code approved, docs changes only; S1, N1 to N5 fixed, BTD1 and
  BTD2 are HC-B63, BTD3 built. Round 3 (sonnet, a short re-check of S1, N5 and BTD3): docs only;
  the 07 sentence, 05 §18 ("forts"), the DEC-405 row (lane-tower map objects) and the INBOX
  wording fixed. Its better-than-design item (one definition per kind) is HC-B63 (1).
- Ponytail: cut 1 was superseded by BTD3; cuts 2 and 3 rejected (the critic asked for one named
  predicate; AGENTS rule 11 injects content).
- Checks run: `npm run check` on 5185d329 plus these changes (09:05Z to 09:14Z) → EXIT=0 after
  555 s: format, no-js, lint, typecheck, knip, coverage (core 317 files / 1922 tests, protocol
  1 / 31, client 333 / 2263, server 29 / 163, all passed), build, "Checked 209 Markdown files
  under docs/." and "Documentation check passed.". An earlier run stopped at `format:check` on
  this entry; it was reformatted.
- Next step: #177 merges first. Then merge phase/3 again, run the full check, and open the PR.
