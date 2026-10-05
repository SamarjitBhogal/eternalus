---
title: Map code audit (2026-10-05)
description: Audit of the merged feat/map and feat/map-view code against ADR 0009 and the map, engine and hardware-abstraction architecture - what was good, which rule each problem broke, what the feat/map-generator branch changed, and where the implementation deliberately differs from architecture 06; read this when reviewing that branch or touching map/, content/maps/, engine/render/ or the map views.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-05
tags: [review, map, minimap, renderer, audit]
paths:
  [
    'packages/core/src/map/**',
    'packages/core/src/content/maps/**',
    'packages/core/src/teams/**',
    'apps/client/src/game/engine/render/**',
    'apps/client/src/game/views/**',
  ]
related:
  [
    'docs/architecture/06-map-and-minimap.md',
    'docs/decisions/0009-config-driven-map-generation.md',
    'docs/agents/prompts/2026-10-03-ultracode-sessions.md',
    'docs/changelog/pr-feat-map-generator.md',
  ]
---

# Map code audit (2026-10-05)

**Purpose.** This audit covers the map code as merged into `main` by PR #1 (`feat/map`, Aryan
Walanj) and PR #2 (`feat/map-view`). It checks that code against ADR 0009, architecture 06
(map and minimap), 08 §4 (renderer) and 09 §4 (display), and the Sprint 1 integration contract
(prompt A, owner decision DEC-04). It then records what branch `feat/map-generator` changed.
Reviewer of the branch: **Aryan Walanj**. Read §4 before assuming the code is wrong where it
differs from architecture 06. Those differences are deliberate and listed there with reasons.

## 1. What was good (kept)

| Area              | Assessment                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map types         | `MapDefinition`, `MapFeature`, `MapTerrain`, `MapLane`: `readonly` throughout, TSDoc on every type, and `Vec2`/`Rect`/`Polygon` in `utils/geometry.types.ts`. All names survive; the shapes are extended.                        |
| Tests             | Unique ids, every point inside the world, one capital per team and, most valuable, the mirror test. All four now run against generated output for several configs and both ground styles (`MapGenerator.test.ts`).               |
| Conventions       | Light on the west and Dark on the east. `TUNE` on every provisional number. The traced sketch at 1600 × 900 world units. All kept: the traced bounds, rift and lane bends now live in the `map-1` preset.                        |
| Renderer          | One class held the 2D context (rule 7 in spirit). `DrawContext` is a `Pick<CanvasRenderingContext2D, …>`, so tests use a fake context. Separate x/y scale. `destroy()` exists. All kept in `Canvas2dRenderer`.                   |
| Scene and minimap | `SceneView` is the one place that sets draw order. `MiniMapView` draws the _same_ scene, so new layers appear on it automatically. A minimap click moves the camera. All kept; the minimap now draws each layer's `drawMinimap`. |
| Camera            | Clamps to the world edges and centres the view when the view is larger than the world. Unchanged.                                                                                                                                |

## 2. What broke which rule

| #   | Finding                                                                                                                                                                            | Rule                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | `MAP_1` hard-coded every coordinate: 18 features, 3 lanes, 16 terrain polygons. Changing `numLanes` was impossible, and so was the requirements doc's litmus test.                 | ADR 0009, D7, FR-012, `AGENTS.md` rule 11, DISC-14                                   |
| 2   | Feature kinds were generic or out of date: `team-structure`, `capital`, `crossing`, `side-objective`. Walls were terrain (`capital-wall`) although they have health and colliders. | ADR 0009 (specific `MapFeatureKind`), architecture 06 §4 and §9                      |
| 3   | `TeamId`/`FeatureOwner` were defined in map content types. Units, structures, commands and events all need a team.                                                                 | ADR 0009, architecture 06 §9, contract §2.2 (`teams/teams.types.ts`)                 |
| 4   | `MapFeature` had no `definitionId` and no `minimapGlyph`. Nothing linked a feature to the content it will spawn, and the minimap could not draw per-definition markers.            | Architecture 06 §4 and §8, contract §2.2                                             |
| 5   | `Renderer` was a concrete class, and views typed against the class. No port, no `engine/render/` folder, and the file was not `Canvas2dRenderer.ts`.                               | Architecture 08 §4 and 09 §4 (Renderer port), `AGENTS.md` rule 7, client `AGENTS.md` |
| 6   | `MapView.ts` had a module-level helper function (`featureColor`) next to the class.                                                                                                | `CONTRIBUTING.md` §3.1 (the class file contains only the class)                      |
| 7   | The mini map drew world-sized squares shrunk by the scale, so marker size depended on the zoom. Markers did not account for the device pixel ratio.                                | Architecture 06 §8 (glyph sizes in minimap pixels), 08 §4 (DPR-aware)                |
| 8   | `packages/core/src/index.ts` repeated its header comment.                                                                                                                          | Architecture 06 §9 (housekeeping)                                                    |
| 9   | The view tests depended on the exact hand-traced data, for example "three lanes".                                                                                                  | Follows from #1                                                                      |

None of this is a criticism of the work. The branch predates ADR 0009 being enforced, and
DEC-04 (2026-10-03) explicitly allows reshaping it.

## 3. What `feat/map-generator` changed

| Change                                                                                                                                                                                                                                                                                                                                                                  | Fixes      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `MapGenerator` (`packages/core/src/map/`) builds the map: pure, deterministic, config + seed → frozen `MapDefinition`. Its `MapBuilder` has one method per step: strongholds, lanes, lane structures, walls, camps, capture points, rift and bounds, obstacles, then build. `validateMapConfig` and `validateMapDefinition` throw `MapGenerationError` naming the rule. | #1         |
| `MAP_1`, `map1Terrain.ts` and `map1.test.ts` are deleted. The traced out-of-bounds polygons, the rift centre line and the north lane's bends now live in `content/maps/presets/map1Preset.ts`. The traced capital walls are replaced by the generated wall ring.                                                                                                        | #1         |
| `MapFeatureKind` is `stronghold`, `spawner-tower`, `buff-tower`, `wall-segment`, `gate`, `turret`, `camp`, `corner-camp`, `capture-point`, `cathedral` or `obstacle`. Bridges are `obstacle`s with `definitionId: 'bridge-segment'`. `MapTerrainKind` is `out-of-bounds` and `rift` only.                                                                               | #2         |
| `packages/core/src/teams/teams.types.ts` (`PlayableTeam`, `Team`). `TeamId` and `FeatureOwner` remain as `@deprecated` aliases exported from `index.ts` for one release.                                                                                                                                                                                                | #3         |
| `MapFeature` is `{ id, kind, team, definitionId, position, minimapGlyph, laneId?, footprint? }`. Definitions (footprint radius, `blocksMovement`, minimap glyph) are content in `content/maps/mapFeatureDefinitions.ts`. Layout tuning is in `content/maps/defaultMapLayout.ts`.                                                                                        | #3, #4     |
| `WorldMap` (`map/WorldMap.ts`) is a walkability grid. Terrain and blocking footprints are blocked. `stampFootprint`/`clearFootprint` use reference counts so overlaps restore correctly. Terrain is never unblocked. No pathing yet.                                                                                                                                    | Sprint 1.3 |
| `engine/render/Renderer.ts` is now the port (interface) and `Canvas2dRenderer.ts` its only implementation. `Renderer.types.ts` moved with them. `fillSquare` became `drawWorldGlyph` (world-sized) and `drawGlyph` (CSS-pixel minimap markers × pixel ratio). Glyph shapes are traced through a lookup table.                                                           | #5, #7     |
| `MapView` draws through `FEATURE_STYLES`, a lookup keyed by `MapFeatureKind` with no `switch`. Walls and gates fill their footprint. The mini map draws each feature's `minimapGlyph`. The colour helpers are private statics. `WorldLayer` gained `drawMinimap`.                                                                                                       | #6, #7     |
| `index.ts` keeps one header comment and exports `MapGenerator`, `MapGenerationError`, `WorldMap`, `DEFAULT_MAP_CONFIG` and the map, team and geometry types.                                                                                                                                                                                                            | #8         |
| The view tests use a generated map and a recording fake `Renderer`. The minimap proof test makes config-only changes (5 lanes, 2 BuffTowers per lane) and checks that every generated feature appears on the mini map with no view change.                                                                                                                              | #9         |

## 4. Where the implementation differs from architecture 06 (deliberate)

The integration contract (prompt A, §2.2) is binding and newer than architecture 06, so where
the two disagree the contract wins. That accounts for D1–D4 below. The rest are judgement calls
where the implementation does something the architecture did not specify, or specified in a way
that breaks its own litmus test. Architecture 06 now records every row in its new §10. D5–D7
are marked there as **pending the owner's decision**, because they change the design rather
than just following the contract. Compare against architecture 06 as of commit `01ec782` to see
the design before this branch.

| #   | Architecture 06 says                                                                                                         | Implemented                                                                                                                                                                                                                                                                                                | Why                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | §4: `MapFeature` is a discriminated union with `owner`, `laneIndex`, `t`, `ringIndex`.                                       | A flat type with `team`, `definitionId`, `minimapGlyph`, `laneId?`, `footprint?`.                                                                                                                                                                                                                          | Contract §2.2 names these fields. A union can come back when `EntityFactory` (session C) needs per-kind data.                                                                                                                                                                                                                                                                          |
| D2  | §4/§9: map types in `map/MapDefinition.types.ts`.                                                                            | They stay in `content/maps/maps.types.ts`.                                                                                                                                                                                                                                                                 | Prompt A step 1 keeps `maps.types.ts`. The core `AGENTS.md` layering also lets `content/` import only `content/`, `utils/` and now `teams/`, so the feature-definition content could not import types from `map/`.                                                                                                                                                                     |
| D3  | §9: teams in `components/Team.types.ts`.                                                                                     | `teams/teams.types.ts`.                                                                                                                                                                                                                                                                                    | Contract §2.2.                                                                                                                                                                                                                                                                                                                                                                         |
| D4  | §8: `MinimapGlyph` in `content/minimapGlyph.types.ts`, drawn by `MinimapView` through `ViewRegistry`/`EntityView.drawGlyph`. | `MinimapGlyph` is in `content/maps/maps.types.ts`. The mini map calls `WorldLayer.drawMinimap`, and `MapView.drawMinimap` draws each feature's glyph.                                                                                                                                                      | The ownership table gives session A `content/maps/**` only. `ViewRegistry`/`EntityView` belong to session H and sprint 1.4. The property ADR 0009 asks for (new feature → on the minimap with no view change) already holds and is tested.                                                                                                                                             |
| D5  | §2: `validateGameConfig()` rejects `campsPerSide % (numLanes - 1) !== 0`.                                                    | `distributeCamps` spreads camps as evenly as possible and gives leftovers to the middle corridors first. With the default 6 camps, 3 lanes give 3/3 and 5 lanes give 1/2/2/1.                                                                                                                              | Under the architecture's rule, the defaults (6 camps) plus `numLanes: 5` are _invalid_. That breaks the ADR 0009 litmus test ("change `NUM_LANES` and the map adjusts") and the prompt's 3 → 5 test. **Possibly better than the architecture.** Owner to confirm.                                                                                                                      |
| D6  | §5: a preset supplies traced `lanePaths` per lane id. A preset with 3 paths and `numLanes: 5` fails validation.              | A preset supplies a lane **profile**: bends `(u, v)` shared by every lane and scaled by each lane's sideways offset. It also supplies a rift **centre line** (the generator cuts one bridge gap per lane) and west out-of-bounds polygons (mirrored east). `map-1` therefore works for any odd `numLanes`. | The default config uses `map-1`. Under the architecture's model, the litmus test fails with the default preset. The profile keeps the traced look (the generated north lane passes within 1 unit of every traced bend, checked by a test) without fixing the lane count. Prompt A asks for "rift/bounds polygons and lane curvature hints". **Possibly better than the architecture.** |
| D7  | §3 step 4: a ring polygon of `wallRing.segments` vertices; the segment a lane crosses becomes its gate.                      | A gate is centred on each lane's exit angle, narrowed if it would overlap a neighbour. Wall segments fill the remaining arcs and are split so none is wider than `maxSegmentArcDegrees`. Turrets stand on every ring corner.                                                                               | With a fixed vertex count, two lanes can cross the same segment, or a lane can cross at a vertex, and then the gate count ≠ `numLanes`. Centring gates on the exits makes "one gate per lane, every lane leaves through its gate" true by construction (tested for 3 and 5 lanes). **Possibly better than the architecture.**                                                          |
| D8  | §1: the constructor takes `(laneShape, rngFactory)`.                                                                         | `new MapGenerator(deps?: Partial<MapGeneratorDeps>)`, where deps are `layout`, `definitions`, `presets`, `createRng` and `createLaneShape`, with defaults.                                                                                                                                                 | A superset of the architecture's injection. Tests swap content (unknown definition, a preset that floods the lanes) as well as the RNG and lane shape.                                                                                                                                                                                                                                 |
| D9  | §2: layout knobs (`strongholdInset`, `wallRing`, `laneBands`, `rift`, …) live on `MapConfig`.                                | `MapConfig` holds only the contract's counts and world size. Layout knobs are `MapLayout` content (`DEFAULT_MAP_LAYOUT`), and a preset may override the lane parts.                                                                                                                                        | Contract §2.2 fixes `MapConfig`, and `config/` belongs to session B. Tuning numbers still live in content, never in code.                                                                                                                                                                                                                                                              |
| D10 | Sprint 1.3: the grid resolution is a config value. Sprint 1.1: `SeededRandom` and `GameConfig` come from B.                  | `navCellSize` is a content value (`DEFAULT_MAP_LAYOUT.navCellSize`). `MapRandom` (mulberry32) and a local `MapConfig`/`DEFAULT_MAP_CONFIG` stand in until B lands, each with a `TODO(sholtzman)`.                                                                                                          | B's `config/` and `utils/SeededRandom` are not on the phase branch yet (prompt A: "define the MapConfig fields you need locally").                                                                                                                                                                                                                                                     |
| D11 | 08 §4 sketches a port with layers, `drawSprite`, `drawPolygon`, `drawText`, `beginFrame`/`endFrame`.                         | The port keeps `feat/map-view`'s method set (`fitWorld`, `fillPolygon`, `strokePath`, …) and adds `drawWorldGlyph`/`drawGlyph`.                                                                                                                                                                            | Prompt A asks only for the port/implementation split. Layers and sprites arrive with session H's `GameLoop`/`Match`. No view depends on a canvas, so the port can grow without view changes.                                                                                                                                                                                           |

## 5. Not done here, and noticed in passing

- Not in scope: pathing and flow fields (Phase 3), `SpatialHash` and `CollisionSystem` (sprint
  1.3, not in prompt A), `ViewRegistry`/`EntityView`/`TerrainView` (session H / sprint 1.4),
  and the `content/maps/standard-three-lane` preset named in the sprint 1.3 checklist. The
  default config plays that role through `DEFAULT_MAP_CONFIG` + `map-1` until B's
  `createDefaultGameConfig()` lands.
- Gates and the Cathedral do not block movement in `WorldMap` (gates are open for the MVP and
  the Cathedral is a capture zone). Per-team gate passage belongs to Phase 2.
- Prompt A step 7 says "10 spawner + 10 buff towers per team" for 5 lanes at 1 per lane. That
  is 5 per team (10 across both teams), which matches reference 05. The tests assert 5 per team.
- Reference 05 says 3 → 5 lanes gives "3 more central capture points"; it is 2 more (3 → 5).
  Left for the doc owner.
- `apps/client/src/game/engine/Camera.ts` only had its import path updated for the renderer
  move. Architecture 08 §5 places it in `engine/camera/`, which is outside session A's files.
- ESLint's flat config does not read `.gitignore`. Linting from the main checkout therefore
  also lints every agent worktree under `.worktrees/`, and an in-progress worktree blocks the
  main checkout's pre-push hook. A one-line `globalIgnores` entry fixes it; that is a tooling
  decision for the owner (raised in the PR, not changed here).

## Related

- [ADR 0009 — config-driven map generation](../decisions/0009-config-driven-map-generation.md)
- [Architecture 06 — map and minimap](../architecture/06-map-and-minimap.md)
- [Sprint 1 session prompts (A)](../agents/prompts/2026-10-03-ultracode-sessions.md)
- [PR description](../changelog/pr-feat-map-generator.md)
- [Scaffold review (2026-09-30)](2026-09-30-scaffold-review.md)
