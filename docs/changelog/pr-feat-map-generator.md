---
title: 'PR: feat/map-generator'
description: The pull-request description for feat/map-generator into phase/1-simulation-kernel-and-world (reviewer Aryan Walanj) - the map audit, the config-driven MapGenerator and WorldMap, the Renderer port and every behavioural change for the feat/map author; read this when reviewing that PR.
audience: [humans]
status: active
owner: sholtzman
last-reviewed: 2026-10-05
tags: [changelog, pull-request, map, minimap, renderer]
related:
  [
    'docs/reviews/2026-10-05-map-code-audit.md',
    'docs/architecture/06-map-and-minimap.md',
    'docs/decisions/0009-config-driven-map-generation.md',
  ]
---

# PR: feat/map-generator

**Purpose.** The description for the pull request from `feat/map-generator` into
`phase/1-simulation-kernel-and-world`. Reviewer: **Aryan Walanj** (DEC-04). Title:

`feat(core): config-driven MapGenerator, WorldMap and Renderer port (map audit)`

---

## Summary

Session A of the Sprint 1 prompts: audits the merged `feat/map`/`feat/map-view` code against
ADR 0009 and the architecture, then makes it fit. The hand-traced `MAP_1` is replaced by a
pure, deterministic `MapGenerator` (config + seed → `MapDefinition`). Changing `numLanes`,
`spawnTowersPerLane` or `buffTowersPerLane` regenerates the map and the minimap with no code
change. The client renderer is split into a `Renderer` port and `Canvas2dRenderer`.

## Why

ADR 0009 / D7 and FR-012: the map must come from config, and the minimap must follow with no code
change. DEC-04 lets the lead architect reshape `feat/map` with Aryan reviewing. The audit
(`docs/reviews/2026-10-05-map-code-audit.md`) lists what was kept, which rule each problem broke,
and every deliberate difference from architecture 06.

## Behavioural changes (for the `feat/map` author)

- `MAP_1` no longer exists. Call `new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, seed)`.
  The result is frozen, and the same config and seed always give a deep-equal map.
- Feature kinds: `capital` → `stronghold`; `team-structure` → `spawner-tower` / `buff-tower` (per
  lane, at `t` bands); `capital-wall` terrain → `wall-segment` and `gate` features with polygon
  footprints, plus `turret`s on the ring corners; `crossing` → `obstacle` with
  `definitionId: 'bridge-segment'` (one per lane at the rift); `side-objective` → `corner-camp`.
  New: `camp` (forest camps between lanes, `forest-camp-light|medium|heavy` by depth, DISC-42)
  and `capture-point` on the outer lanes (`cathedral` on the middle one).
- `MapFeature.owner` → `team` (`'light' | 'dark' | 'neutral'`, from `teams/teams.types.ts`). New
  fields: `definitionId`, `minimapGlyph`, `laneId?`, `footprint?`. `TeamId`/`FeatureOwner` are
  still exported but `@deprecated`.
- `MapTerrainKind` is `'out-of-bounds' | 'rift'`. `MapDefinition` gains `seed`; `MapLane` gains
  `index`.
- Lane ids are `lane-0`… (north to south); feature ids look like `light-spawner-tower-lane-0-0`,
  `dark-gate-lane-2` or `west-camp-corridor-1-0`.
- Layout: the Strongholds sit at x = 130 / 1470, not 55 / 1545 (the wall ring must fit inside
  the world). The traced north lane bends, the corner objectives (320, 80), the Cathedral (800, 450)
  and the lane crossings (y = 100 / 450 / 800) are kept, and a test checks them. The traced
  middle-lane wobble is gone (the middle lane is straight).
- Map-1's look is now `content/maps/presets/map1Preset.ts`: out-of-bounds corners, the rift
  centre line and lane bends only. It works with any odd `numLanes`.
- `numLanes` must be odd and ≥ 1 (the Cathedral needs a middle lane). `cornerCamps` must be even.
  Invalid configs throw `MapGenerationError` naming the field.
- New `WorldMap.fromDefinition(map, cellSize, isBlocking)`: a walkability grid with
  `stampFootprint`/`clearFootprint`.
- Client: `engine/Renderer.ts` → `engine/render/Canvas2dRenderer.ts` (implements the
  `engine/render/Renderer.ts` interface). `fillSquare` → `drawWorldGlyph`; new `drawGlyph` for
  minimap markers. `resize` takes the device pixel ratio. `WorldLayer` gains `drawMinimap`.
  `MapView` styles features through `FEATURE_STYLES`. The mini map draws each feature's own
  `minimapGlyph`.
- Public API (`@eternalus/core`): adds `MapGenerator`, `MapGenerationError`, `WorldMap`,
  `DEFAULT_MAP_CONFIG` and the types `MapConfig`, `MapGeneratorConfig`, `PlayableTeam`, `Team`,
  `MinimapGlyph`, `MinimapGlyphShape`, `MinimapColourRole`; removes `MAP_1`.

## Decisions for the owner

Architecture 06 §10 rows **D5** (uneven camp split instead of rejecting it), **D6** (preset as lane
profile + rift centre line, so `map-1` works for any lane count) and **D7** (gates centred on
lane exits) differ from the written design. In each case the written design would break the
ADR 0009 litmus test, or could put two lanes through one gate. They are marked _pending owner
decision_.

Tooling (not changed here): ESLint's flat config does not read `.gitignore`, so `npm run lint`
from the main checkout also lints `.worktrees/*`, and one in-progress worktree blocks every
push from the main checkout. Proposed fix: add `.worktrees/` and `.claude/worktrees/` to
`globalIgnores` in `eslint.config.js`.

## Stacking note

This branch is cut from `docs/inbox-decisions-2026-10-03` (the phase branch was created from
`main` before that docs PR merged), so the diff shows the docs commit until that PR lands and
`main` is merged into the phase branch.

## How it was tested

- New core tests: `MapGenerator.test.ts` covers determinism, a seed changing only obstacles,
  frozen output, mirror symmetry and unique ids and containment for both grounds, numLanes 3 → 5
  (5 lanes, 5 capture points, 5 + 5 towers and 5 gates per team, camps over 4 corridors), N
  towers per lane with SpawnerTowers in front, gates at the lane ends, turrets per ring corner,
  capture points on the centre line, DISC-42 weight ordering, rift gaps and bridges, obstacles
  off the lanes, the map-1 golden coordinates and every validation error. Plus `WorldMap`,
  `MapRandom`, `LaneGeometry`, `campPlacement`, `wallRing`, `geometry` and the public API.
- Client tests: `Canvas2dRenderer` glyph tracing, DPR-scaled minimap glyphs and outlined rings;
  `MapView` styles and minimap glyphs through a recording `Renderer`; the minimap proof test
  (config-only change → new features in the mini map's draw calls); `SceneView` minimap order.
- `npm run check`: result in `docs/plan/PROGRESS.md` (2026-10-05 entry) and in the PR
  conversation.

## Checklist

- [x] `npm run check` passes locally
- [x] Tests added or updated (bug fixes include a test that failed before the fix)
- [x] No guardrail changes, **or** justified here with a link to the ADR
- [x] No new dependencies, **or** each one justified here in one line and approved by a human
- [x] Changes stay within the scope of the task
- [x] Docs updated where behaviour or workflow changed

Reviewer: @Aryan976503 (Aryan Walanj).
