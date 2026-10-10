---
title: Map and minimap
description: How the map is generated from GameConfig by a pure MapGenerator, what the MapDefinition and WorldMap types are, and why the minimap shows every new map feature with no code change. Read this before touching packages/core/src/map/, content/maps/ or MinimapView.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-10
tags: [architecture, map, minimap, generation, world]
paths:
  [
    'packages/core/src/map/**',
    'packages/core/src/content/maps/**',
    'packages/core/src/teams/**',
    'apps/client/src/game/views/MiniMapView*',
    'apps/client/src/game/views/MapView*',
  ]
related:
  [
    'docs/architecture/03-game-model.md',
    'docs/architecture/07-structures-obstacles-and-destructibles.md',
    'docs/architecture/08-game-engine.md',
    'docs/architecture/10-physics.md',
  ]
---

# Map and minimap

**Purpose.** Read this when you add or change anything about where things are on the map
(lanes, towers, walls, camps, capture points, the rift, obstacles), when you touch the runtime
grids that pathing and collision read (`WorldMap`), or when you wonder why the minimap needs no
code for a new structure kind. It records decision D7 (ADR 0009): the map is **generated from
config** by a pure `MapGenerator`; hand-traced coordinates are never the source of truth. Code
below is the design sketch unless it is labelled a contract. The generator now exists in
`packages/core/src/map/` (branch `feat/map-generator`, which replaced `feat/map`'s hand-traced
`MAP_1`, reviewed in §9). Where the code is still interim, §10 says so.

## 1. The decision and the litmus test

The requirements doc gives the acceptance test: change `NUM_LANES`, `NUM_SPAWN_TOWERS`,
`NUM_BUFF_TOWERS` in a config file and the map adjusts. We generalise it to a `MapConfig` object
on `GameConfig.map` and one pure function:

```ts
// packages/core/src/map/MapGenerator.ts (sketch)
export class MapGenerator {
  constructor(
    private readonly laneShape: LaneShape,
    private readonly rngFactory: RngFactory,
  ) {}
  /** Pure: same config + seed = same MapDefinition. No Math.random, no Date. */
  generate(config: GameConfig, seed: number): MapDefinition;
}
```

Pure because the generator runs in Node tests, in the client before `Simulation` starts and later
in a Worker with identical output. A class rather than a free function because the `LaneShape`
strategy and the `Rng` factory arrive by constructor injection, so tests can swap them (DIP).

- **MVP**: three straight lanes, 1 `SpawnerTower` + 1 `BuffTower` per lane, one `Stronghold` per
  team inside a wall ring with gates and turrets, 6 camps per side, 3 capture points (middle one
  is the `Cathedral`), the rift, out-of-bounds polygons.
- **MVP-if-time**: corner camps (`cornerCamps`), destructible bridge segments across the rift,
  scattered obstacles (trees, rocks).
- **post-MVP**: curved (Bézier) lanes, several authored presets, fog of war on the minimap.

## 2. Map configuration (`GameConfig.map`)

```ts
// GameConfig.map (contract: integration contract §2.2; owned by config/)
export type MapConfig = {
  readonly numLanes: number;
  readonly spawnTowersPerLane: number;
  readonly buffTowersPerLane: number;
  readonly campsPerSide: number;
  readonly cornerCamps: number; // MVP-if-time
  readonly worldWidth: number; // world units (10-physics.md §1)
  readonly worldHeight: number;
  readonly presetId?: string; // an authored look (§5)
};
```

Counts and the world size are config; how the map is laid out is content. `MapLayout` in
`content/maps/` (the default is `DEFAULT_MAP_LAYOUT`) holds the Stronghold inset, the wall ring,
the lane bands and lane profile, camp bands and weight classes, rift sizes and obstacle rules,
each marked `TUNE` there. The map is always mirrored west ↔ east (Light west, Dark east), so there
is no symmetry setting.

`validateGameConfig()` rejects, naming the field and the rule: `numLanes < 1` or even (the
Cathedral needs a middle lane; **Recommendation:** keep this rule for the MVP rather than invent an
off-lane Cathedral); negative or fractional counts; an odd `cornerCamps` (corner camps are
mirrored); camps with a single lane; a world that is not a positive, finite size. Generation also
rejects layout content that breaks its own rules and any map whose gates would be closed by their
own turrets (use fewer lanes or a larger ring). `campsPerSide` does not have to divide by the
corridors: it is split as evenly as possible, leftovers to the middle corridors (DEC-14). A config
typo fails at boot, not mid-match.

## 3. `MapGenerator` and the `MapBuilder`

`generate` is a Template Method that runs a `MapBuilder` (Builder pattern) step by step. Each
step appends features to the definition under construction and reads only config, the seeded
`Rng` and earlier steps' output. The order is fixed because later geometry depends on earlier:

```mermaid
flowchart LR
  A[placeStrongholds] --> B[layLanes] --> C[placeLaneStructures] --> D[raiseWalls]
  D --> E[placeCamps] --> F[placeCapturePoints] --> G[carveRiftAndBounds]
  G --> H[scatterObstacles] --> I[build]
```

1. **placeStrongholds**: light at `(strongholdInset, worldHeight / 2)`, dark at its mirror.
2. **layLanes**: lane `i`'s light gate sits on the wall ring at an angle spread evenly over the arc
   facing the enemy. The `LaneShape` strategy traces only the Light half, from the gate to where
   the lane crosses the symmetry axis, and the generator mirrors it, so every lane is symmetric by
   construction (DEC-14). The MVP shape, `ProfileLaneShape`, runs straight out of the gate for an
   apron, so the lane clears the gate's turrets, then through the bends of a lane profile that
   move it east. A one-bend profile is the MVP straight lane; a preset's bends give the hand-drawn
   look for any lane count (§5). Every segment is straight, as the game doc asks ("lanes are kept
   straight to simplify collision detection"). A Bézier shape is a **post-MVP** implementation of
   the same interface (OCP: new shape, new class).
3. **placeLaneStructures**: per lane and team, `spawnTowersPerLane` `spawner-tower` features at
   parametric positions `t` spread evenly inside `laneBands.spawner`, and `buffTowersPerLane`
   `buff-tower` features inside `laneBands.buff`. `t` is the arc-length fraction from the team's
   own gate (`t = 0`) to the enemy gate (`t = 1`): "front line" and "second line" are bands, not
   coordinates, so N per lane works for any N.
4. **raiseWalls**: one `gate` centred on each lane's exit; `wall-segment`s fill the rest of the
   ring, split so that none spans more than a maximum arc; a `turret` sits on every ring corner.
   Gate count equals `numLanes` and every lane leaves through its own gate by construction; a
   gate that its own turrets would close is rejected (§2, DEC-14).
5. **placeCamps**: `campsPerSide` is split over the `numLanes - 1` corridors between adjacent
   lanes as evenly as possible, leftovers to the middle corridors (DEC-14). In a corridor, camps
   spread across the team's half and step from one lane towards the other; a camp's weight class
   follows its depth into the Unknown, lighter near a lane and heavier deeper (DISC-42).
   `cornerCamps` `corner-camp` features go in the map corners (MVP-if-time).
6. **placeCapturePoints**: one `capture-point` at `t = 0.5` of each lane; the middle lane's is
   emitted as `cathedral`.
7. **carveRiftAndBounds**: the rift runs along the symmetry axis, centred on it (a preset may vary
   its width, §5), with a `rift.bridgeWidth` gap where each lane crosses it (bridge-segment
   obstacles fill the gaps when enabled); out-of-bounds polygons close the corners, west shapes
   mirrored east.
8. **scatterObstacles**: seeded scatter of tree/rock obstacles on walkable ground away from lanes
   and features; rejected samples still consume the `Rng` in a fixed order, so output is
   reproducible per seed.
9. **build**: assign ids (`light-spawner-tower-lane-0-0`), validate (§7) and freeze.

Symmetry is not a step: every team feature and every lane is placed for `light` and mirrored with
`mirrorPoint` from `map/symmetry.ts`, and the validator checks the result. That is the DRY fix for
the hand-traced branch, where each dark coordinate was typed by hand.

```ts
// packages/core/src/map/LaneShape.types.ts (contract)
export interface LaneShape {
  /** The Light half, gate to axis crossing, x never decreasing; the generator mirrors it. */
  traceLightHalf(input: LaneTraceInput): readonly Vec2[];
}
// LaneTraceInput: the Stronghold, the axis, the lane's sideways offset, the ring, the exit angle
// and the apron. LaneGeometry (sketch) wraps a traced path: length, pointAt(t), tangentAt(t),
// corridor polygon.
```

## 4. `MapDefinition` types

The `feat/map` branch already has `MapDefinition`, `MapFeature`, `MapTerrain`, `MapLane`, `Vec2`
and `Polygon`. We keep those names. `MapFeature` is the flat shape fixed by the integration
contract (§2.2), and the content definition it names (`definitionId`) carries what `EntityFactory`
needs:

```ts
// packages/core/src/content/maps/maps.types.ts (contract)
export type MapFeatureKind =
  | 'spawner-tower'
  | 'buff-tower'
  | 'stronghold'
  | 'wall-segment'
  | 'gate'
  | 'turret'
  | 'camp'
  | 'capture-point'
  | 'cathedral'
  | 'corner-camp'
  | 'obstacle';

export type MapFeature = {
  readonly id: string;
  readonly kind: MapFeatureKind;
  readonly team: Team; // 'light' | 'dark' | 'neutral', from teams/teams.types.ts
  readonly definitionId: string; // content id, e.g. 'spawner-tower', 'tree'
  readonly position: Vec2;
  readonly minimapGlyph: MinimapGlyph; // §8
  readonly laneId?: string; // lane structures, gates, capture points, bridges
  readonly footprint?: Polygon; // when the definition has a size
};

export type MapTerrainKind = 'out-of-bounds' | 'rift'; // ground polygons that are not entities
export type MapLane = {
  readonly id: string;
  readonly index: number;
  readonly path: readonly Vec2[];
};
export type MapDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  readonly lanes: readonly MapLane[];
  readonly terrain: readonly MapTerrain[];
  readonly features: readonly MapFeature[];
};
```

Each feature kind maps to one entity kind in `EntityRegistry` (Factory). `EntityFactory.fromFeature`
is the only code that reads a feature's kind; adding a kind means one union member, one content
definition and one registry line (the product owner's litmus test).

| Kind            | Owner   | Placed by           | Entity                       | MVP status  |
| --------------- | ------- | ------------------- | ---------------------------- | ----------- |
| `stronghold`    | team    | placeStrongholds    | `Stronghold`                 | MVP         |
| `spawner-tower` | team    | placeLaneStructures | `SpawnerTower`               | MVP         |
| `buff-tower`    | team    | placeLaneStructures | `BuffTower`                  | MVP         |
| `wall-segment`  | team    | raiseWalls          | `WallSegment`                | MVP         |
| `gate`          | team    | raiseWalls          | `Gate`                       | MVP         |
| `turret`        | team    | raiseWalls          | `Turret`                     | MVP         |
| `camp`          | neutral | placeCamps          | `Camp`                       | MVP         |
| `corner-camp`   | neutral | placeCamps          | `Camp`                       | MVP-if-time |
| `capture-point` | neutral | placeCapturePoints  | `CapturePoint` (zone)        | MVP         |
| `cathedral`     | neutral | placeCapturePoints  | `CapturePoint` + `Cathedral` | MVP         |
| `obstacle`      | neutral | scatterObstacles    | `Obstacle`                   | MVP-if-time |

## 5. Authored presets (`content/maps/`)

Designers will want the hand-drawn look of the team sketch. Presets are allowed, but they are
**overrides of generator inputs, never coordinates of features** (DEC-14):

```ts
// packages/core/src/content/maps/maps.types.ts (contract)
export type MapPreset = {
  readonly id: string;
  readonly displayName: string;
  readonly westOutOfBounds: readonly Polygon[]; // fractions of the world; mirrored east
  readonly riftProfile: readonly RiftWidthKnot[]; // width along the axis; the rift stays centred
  readonly laneProfile?: readonly LaneKnot[]; // bends shared by every lane, scaled per lane
};
```

A preset never lists a lane, so it cannot fix the lane count: the generator still places lanes,
towers, gates, camps and capture points from `MapConfig`, and the bridge gaps follow wherever the
lanes cross. Shapes are fractions of the world size, so a preset scales with the world; layout
lengths stay absolute, so a world too small for them is rejected. Ground that would block a
configured lane fails validation naming the lane and the terrain instead of drawing the wrong map.

## 6. `WorldMap` runtime

`WorldMap` is the mutable per-match view of the map that systems read. It is built once from the
`MapDefinition` and updated only through events (never by views or the client):

```ts
// packages/core/src/map/WorldMap.ts (sketch)
export class WorldMap {
  static fromDefinition(def: MapDefinition, cellSize: number, isBlocking: BlockingRule): WorldMap;
  readonly cols: number;
  readonly rows: number;
  readonly walkable: Uint8Array; // 1 = walkable
  readonly cost: Uint8Array; // 1..254 movement cost, 255 = blocked (Emerson's cost stamps)
  stampFootprint(footprint: Polygon, cost: number): readonly number[]; // returns dirty cells
  clearFootprint(footprint: Polygon): readonly number[];
  flowField(laneIndex: number, team: Team): FlowField; // cached, dirty-flagged
  rebuildDirty(cellBudget: number): void; // time-sliced; PathingSystem calls it each tick
}
export type FlowField = { readonly integration: Uint16Array; readonly direction: Int8Array };
```

- The grid is derived from the definition at load (walls, closed gates, structures and obstacles
  stamp their footprints); it is never hand-authored
  ([research §3](../research/game-architecture-and-performance-research.md#3-pathfinding-and-movement-for-lane-minions-and-large-unit-counts)).
- One flow field per (lane, team), flood-filled from the enemy gate inside the lane corridor;
  `PathingSystem` follows it, Legends use A* on the same grid (`10-physics.md` §9).
- Destructible terrain events (`07-structures-obstacles-and-destructibles.md` §10) re-flag cells
  through `stampFootprint`/`clearFootprint`; affected fields are marked dirty and rebuilt over
  several ticks with a cell budget (Dirty Flag; time slicing as in Supreme Commander 2).
- Footprint stamps are reference-counted over a separate terrain layer, so clearing one
  footprint never re-opens a cell that another footprint or terrain still covers; every cell a
  shape touches is blocked, so a wall thinner than a cell leaves no gap (DEC-14).
- Typed arrays keep the hot data allocation-free and transferable (D8).

## 7. Generator tests (`packages/core/src/map/MapGenerator.test.ts`)

- **Mirror invariant** (kept from `feat/map`, generalised): for every `light` feature there is
  exactly one `dark` feature of the same kind, definition and lane at the mirrored position;
  neutral features, terrain shapes and lanes are self-mirrored or paired. Light is west, dark is
  east.
- **Counts follow config**: `numLanes = 5, spawnTowersPerLane = 2` yields 5 lanes, 10 spawner
  towers per team, 5 gates per ring, 5 capture points (1 cathedral), `campsPerSide` camps per side.
- **Determinism**: two `generate(config, seed)` calls are deep-equal; a different seed changes
  only obstacle scatter, never team features.
- **Containment**: every point lies inside the world; no team feature overlaps the rift or
  out-of-bounds terrain; every lane crosses its ring exactly at its gate.
- **Connectivity**: on the `WorldMap` grid every lane joins the two Strongholds, and closing the
  gates seals each ring (no gap between wall pieces).
- **Validation**: every rule in §2 throws with its field named, as do ground that blocks a lane,
  a lane that runs west or through a structure, and a lost mirror twin. A golden hash pins the
  default map, so any change in output is a deliberate one.

## 8. Minimap

The minimap is **the same scene drawn smaller**, not a second scene graph
([research §5](../research/game-architecture-and-performance-research.md#5-canvas-2d-performance)).

- `MinimapView` (`apps/client/src/game/views/MinimapView.ts`, L4) reads the same `Snapshot` that
  `SceneView` reads and walks the same `ViewRegistry`. It draws into the `'minimap'` layer of the
  `Renderer` (an offscreen canvas composited into the `MinimapPanel` slot) at a lower cadence
  (**Recommendation:** every 6th frame, TUNE) and redraws its terrain backdrop only when
  `snapshot.terrainVersion` changes (Dirty Flag).
- `MinimapProjection` (`apps/client/src/game/engine/camera/`) implements the same `Projection`
  port as `Camera` (`worldToScreen`/`screenToWorld`) with a fixed scale, so culling and coordinate
  code is shared and the HUD can turn a minimap click into a world position for a `Command`.
- Every definition (structure, obstacle, unit, zone) may declare a `minimapGlyph`; the base
  `EntityView.drawGlyph` reads it and falls back to `DEFAULT_MINIMAP_GLYPH`. Team colour comes from
  the entity's `team`, not from the glyph.

```ts
// packages/core/src/content/maps/maps.types.ts (contract)
export type MinimapGlyph = {
  readonly shape: 'dot' | 'square' | 'diamond' | 'ring';
  readonly size: number; // minimap pixels
  readonly colourRole: 'team' | 'neutral' | 'objective' | 'terrain' | 'obstacle';
};

// apps/client/src/game/views/EntityView.ts (sketch)
export abstract class EntityView {
  abstract draw(entity: EntitySnapshot, ctx: DrawContext): void;
  drawGlyph(entity: EntitySnapshot, ctx: DrawContext): void {
    const glyph = ctx.definitions.get(entity.definitionId)?.minimapGlyph ?? DEFAULT_MINIMAP_GLYPH;
    ctx.renderer.drawGlyph(glyph, ctx.projection.worldToScreen(entity.position), entity.team);
  }
}
```

Because the generator emits features from config, `EntityFactory` turns every feature into a
snapshot entity, and `MinimapView` draws every snapshot entity through the registry, the
requirement "new building on map = new building on minimap with no code change" holds **by
construction**. The test that proves it (`MinimapView.test.ts`):

```ts
it('draws one glyph per generated feature: extra config features need no view code', () => {
  const draw = (map: MapConfig) => {
    const sim = Simulation.create({ ...config, map }, SEED);
    const renderer = new RecordingRenderer(); // test double for the Renderer port
    const projection = new MinimapProjection(map, MINIMAP_SIZE);
    new MinimapView(viewRegistry, projection).draw(sim.snapshot(), renderer);
    return { projection, calls: renderer.calls.filter((c) => c.op === 'drawGlyph') };
  };
  const base = draw(config.map);
  const more = draw({ ...config.map, buffTowersPerLane: config.map.buffTowersPerLane + 1 });
  // one extra tower per lane per team
  expect(more.calls.length - base.calls.length).toBe(2 * config.map.numLanes);
  for (const call of more.calls) {
    expect(call.position).toEqual(more.projection.worldToScreen(call.source.position));
  }
});
```

A second test registers a throwaway `StructureDefinition` (`'beacon'`) with a glyph and one
generated feature, and asserts the glyph is drawn without registering any `EntityView` (the
default view handles it). Fog of war on the minimap is **post-MVP**: when enabled, `MinimapView`
filters entities by the player team's `Vision` snapshot before drawing.

## 9. Review notes for the `feat/map` branch

Written for the PR review; the branch is a good first step and most of it survives.
**Status (2026-10-05):** acted on by `feat/map-generator` (PR #8); see
[the map code audit](../reviews/2026-10-05-map-code-audit.md) for what changed. These notes are a
record: where they differ from §1–§8 (for example per-lane `lanePaths` in presets), §1–§8 are
the design (DEC-14).

**Keep**

- The type names `MapDefinition`, `MapFeature`, `MapTerrain`, `MapLane`, the `readonly` style,
  the TSDoc, and `Vec2`/`Rect`/`Polygon` in `utils/geometry.ts` (they become the shared geometry
  primitives for `10-physics.md`).
- The tests (unique ids, containment, one capital per team, and especially the mirror test); they
  move to `MapGenerator.test.ts` and run against generated output for several configs.
- The convention light = west, dark = east, and the `TUNE` comments on provisional values.

**Change**

- `MAP_1` hard-codes every coordinate; D7 makes the generator the source of truth. Keep the traced
  lane polylines as the `map-1` preset's `lanePaths` (light half only) and drop the hand-typed
  structure positions; towers, camps and capture points come from `t` bands.
- `'team-structure'` is too generic for the factory: split into `spawner-tower`, `buff-tower`,
  `stronghold`, `wall-segment`, `gate`, `turret` (§4). `'capital'` becomes `stronghold`,
  `'side-objective'` becomes `corner-camp`, `'crossing'` becomes bridge-segment `obstacle`s.
- `TeamId` should not live in `content/maps/mapDefinition.ts`; move it to a shared teams module
  (**Recommendation:** `packages/core/src/components/Team.types.ts` exporting
  `TeamId = 'light' | 'dark' | 'neutral'` and `PlayableTeamId`) because units, structures,
  commands and events all need it; `FeatureOwner` then disappears.
- `'capital-wall'` terrain becomes `wall-segment` features (walls have health and colliders, so
  they are entities, not ground). `MapTerrain` keeps `out-of-bounds` and `rift`.
- `index.ts` repeats its header comment; keep one copy. Exporting `MAP_1` as a runtime value will
  become `MAP_1_PRESET` plus `MapGenerator`, and the `index.test.ts` assertion on
  `Object.keys(core)` changes with it.
- File names: `mapDefinition.ts` holds only types, so the repo convention makes it
  `MapDefinition.types.ts` under `map/` (`CONTRIBUTING.md` §3.1).

## 10. Implementation status

The design points that differ from the 2026-09-30 sketch were signed off by the owner on
2026-10-06 (DEC-14, [decisions log](../reference/game-design/13-owner-decisions-log.md)) and are
part of §2–§6; why each one differs is recorded in
[the map code audit](../reviews/2026-10-05-map-code-audit.md) §4 and §6.

Still interim:

| Topic                     | Today                                                                                                                                                                                                                                                                         | Until                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Minimap (§8)              | `MiniMapView` draws each layer's `drawMinimap`; `MapView` draws every feature's `minimapGlyph`                                                                                                                                                                                | Session H's `ViewRegistry`, `EntityView` and the snapshot-driven `MinimapView`                     |
| Kernel stand-ins (§1, §2) | `MapRandom`, a local `MapConfig` and `DEFAULT_MAP_CONFIG`, `validateMapConfig`                                                                                                                                                                                                | Session A's swap to session B's `SeededRandom`, `GameConfig` and `validateGameConfig` (`INBOX.md`) |
| Grid resolution (§6)      | `MapLayout.navCellSize` (content)                                                                                                                                                                                                                                             | Session A's swap to `config.map.navCellSize`                                                       |
| `WorldMap` (§6)           | Walkability grid with stamping                                                                                                                                                                                                                                                | Cost grid and flow fields (Phase 3)                                                                |
| Renderer port (08 §4)     | The `feat/map-view` method set plus glyph drawing                                                                                                                                                                                                                             | Session H's layers and sprites                                                                     |
| Map scenery (08 §4)       | `MapSceneryBuilder` dresses the generated map with presentation-only polygons authored in map-1's 1600 × 900 sketch (`content/maps/map1Scenery.ts`, `map1Landforms.ts`) and stretched to the world size; `MapView` draws the `ground` layer, `SceneryView` the `detail` layer | Per-preset scenery and sprite assets                                                               |
| Free view and interior    | `MapExplorer` in `Match`: drag pan, wheel zoom, overview and the presentation-only cathedral interior (`CathedralInteriorBuilder`); walking returns to the following camera outside the cathedral                                                                             | Player movement, doorways and collision into the interior                                          |
| Camp weights (§3 step 5)  | Depth-based classes (DISC-42)                                                                                                                                                                                                                                                 | The owner's answer to DEC-15                                                                       |

The merged presentation uses `MapLayout` to dress generated maps without scaling or replacing
simulation geometry. It adds building footprints and roof/interior decoration metadata derived
from generated feature IDs and positions. `Match` renders those cutaways in the same scene as
player entities; clicks toggle roofs without changing the camera or map. Both strongholds keep
oval walls, lane-aligned gate passages, throne aisles and six furnished side rooms. The cathedral
keeps its cross-shaped furnished interior and capture court. `MapExplorer` retains camera
handoff, aspect-correct pan/zoom and minimap navigation; overview restores every roof.
The older exported `CathedralInteriorBuilder` remains for API compatibility, but `Match` no
longer uses its separate interior scene. Building collision and occupancy-driven roof hiding
remain future simulation work.

## Related

- [03 Game model](./03-game-model.md)
- [07 Structures, obstacles and destructibles](./07-structures-obstacles-and-destructibles.md)
- [08 Game engine](./08-game-engine.md) (render pipeline, `SceneView`, `ViewRegistry`)
- [10 Physics](./10-physics.md) (grid resolution, colliders, `SpatialHash`)
- [11 Game AI](./11-game-ai.md) (flow-field following)
- [17 Extension recipes](./17-extension-recipes.md)
- [Map code audit (2026-10-05)](../reviews/2026-10-05-map-code-audit.md)
- [Research: game architecture and performance](../research/game-architecture-and-performance-research.md)
- [Reference: map](../reference/game-design/05-map.md)
