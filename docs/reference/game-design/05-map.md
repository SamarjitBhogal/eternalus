---
title: Map
description: Map 1 as the game doc describes it, the rule that the map and minimap are generated from config, the MVP layout summary and the provisional feat/map data; read it before working on MapGenerator, terrain, obstacles or the minimap.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-07
tags: [reference, game-design, map, minimap, terrain]
paths:
  [
    'packages/core/src/map/**',
    'packages/core/src/content/maps/**',
    'packages/core/src/content/obstacles/**',
  ]
related:
  - 'docs/architecture/06-map-and-minimap.md'
  - 'docs/reference/game-design/03-structures-and-defenses.md'
  - 'docs/reference/game-design/04-objectives-capture-points-and-bosses.md'
---

# Map

**Purpose.** Read this when you work on the world: lanes, terrain, obstacles, bridges, the
placement of structures, camps and capture points, or the minimap. It records the vision for
Map 1 and the one hard requirement that shapes the architecture: **the map is generated from
config, and the minimap follows the map with no code change**.

## Map 1 (the vision)

Terrain and buildings are destructible. From the game doc:

| Feature                                                                                                                                               | Status                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| A standard-looking **three-lane funnel**. Each lane has a primary connector into the other team's zone.                                               | **MVP**                                                |
| The **middle lane holds the Cathedral**, the major capture point. The **outer lanes hold lesser capture points** (with the quarter-mark mini-bosses). | **MVP**                                                |
| **Bridges are destructible.**                                                                                                                         | **MVP-if-time**                                        |
| **A massive rift through the centre of the map divides the team territories.**                                                                        | **MVP** (as impassable terrain; visuals if time)       |
| The map starts green and grassy with trees. **All grass and trees can burn or be felled.**                                                            | **MVP-if-time**                                        |
| **Falling trees do damage and break the ground; they stay felled and can be picked up by strong enough characters, depending on tree size.**          | **MVP-if-time**                                        |
| **MVP: lanes are kept straight** to simplify collision detection ("JavaScript hitboxes").                                                             | **MVP**                                                |
| Corner camps sit in the map's corners, surrounded by impassable rifts ("the purple").                                                                 | **MVP-if-time**                                        |
| Multiple maps                                                                                                                                         | **post-MVP** (`[STATUS: idea-pending]`; "Not for MVP") |

Reference games for the layout: Battle for Middle-earth (top-down) and League of Legends
(lane-based).

## The generated-map requirement (decided, D7)

The requirements doc's own example of "no hardcoding":

> MVP has three lanes with 1 spawner tower and 1 buff tower per lane. I should be able to change
> 3 values in a config file (`NUM_LANES`, `NUM_SPAWN_TOWERS`, `NUM_BUFF_TOWERS`) and the map
> would adjust accordingly.

And for the minimap:

> Minimap should reflect the map changes with no code change needed. If map adds an obstacle,
> minimap shows it without changing code. New building on map = new building on minimap, no code
> change needed.

What this means (brief decision D7; details in `../../architecture/06-map-and-minimap.md`):

- `GameConfig` holds `numLanes`, `spawnTowersPerLane`, `buffTowersPerLane`, `campsPerSide` and
  the world size. A pure `MapGenerator` (config + seed → `MapDefinition`) places lanes,
  structures, walls, gates, turrets, camps, capture points, the rift and the bridges by rule and
  symmetry. Hand-traced coordinates are **not** the source of truth.
- The minimap is a second view of the same snapshot the main canvas draws. `MinimapView` asks
  the `ViewRegistry` for each entity kind's minimap glyph; a new entity kind registers one
  view and appears on both, with no minimap code change.
- Changing `numLanes` from 3 to 5 must produce a valid, symmetric map with 5 SpawnerTowers and 5
  BuffTowers per team and 3 more central capture points; that is the acceptance test.

## MVP layout summary

From the requirements doc's MVP list (all **MVP**, counts `TUNE` only in the sense that they are
config values):

- **3 lanes**, straight.
- Per team: **1 SpawnerTower (front line) + 1 BuffTower (second line) per lane**, a **wall**
  with gates and turrets around the **Stronghold**, and the Stronghold itself.
- **6 forest camps per team side**, placed between the lanes: **1 lane → 3 camps → middle lane →
  3 camps → 1 lane**. Camps spawn nothing until after their cooldown.
- **3 central capture points**, one per lane; the middle one is the Cathedral.
- Corner camps (4, one per map corner) are **MVP-if-time**.

A schematic of one half of the map (Light side; the Dark side mirrors it). Not to scale:

```text
   corner camp                                                          corner camp
   ┌─────┐   top lane:    Stronghold ─ BuffTower ─ SpawnerTower ─ ─ ─ capture point ─ ─ ─ ▶ Dark
   └─────┘                    │        (3 forest camps between top and middle lanes)
        wall/gates/turrets ── │
   Light Stronghold ──────────┤  middle lane: Stronghold ─ BuffTower ─ SpawnerTower ─ Cathedral ─ ─ ▶ Dark
                              │        (3 forest camps between middle and bottom lanes)       rift ║
   ┌─────┐                    │
   └─────┘   bottom lane:  Stronghold ─ BuffTower ─ SpawnerTower ─ ─ ─ capture point ─ ─ ─ ▶ Dark
   corner camp                                                          corner camp
```

Placement rules the generator follows: SpawnerTower ahead of BuffTower on every lane; camps
equidistant between adjacent lanes; capture points on the lane centre line at the map's centre;
the rift along the centre line between the two territories with one bridge per lane; corner
camps outside the lanes behind impassable rifts.

## Obstacles and destructible terrain

- **Obstacles** are data-driven kinds: tree, rock, bridge segment. Each is breakable or
  unbreakable, and may be `Carryable` (a felled tree, a wall chunk). A felled tree damages what it
  lands on and "breaks the ground"; `Recommendation:` model "breaks the ground" as a terrain
  cost change on the nav grid, not as a new entity.
- **Burning**: grass and trees can burn. Fire is a `StatusEffect` on obstacles that spreads to
  neighbours found through the spatial hash; Blade Runner's magical variety and Firestorm
  (post-MVP) are the sources. **MVP-if-time**.
- **Bridges** are destructible segments over the rift; destroying one removes the crossing for
  that lane and dirties the lane's flow field. **MVP-if-time**.
- Walls and gates are structures (`03-structures-and-defenses.md`), not obstacles, because they
  have a team and shield bars.

Whatever is destroyed changes pathing: the nav cost grid is stamped from the map model at load
and re-stamped when an obstacle or structure changes; lane flow fields are marked dirty and
rebuilt over a few ticks
(`../../research/game-architecture-and-performance-research.md#3-pathfinding-and-movement-for-lane-minions-and-large-unit-counts`).

## Provisional data from the `feat/map` branch

The team's `feat/map` branch traced Map 1 by hand as `packages/core/src/content/maps/map1.ts`
and `map1Terrain.ts`: a **1600 × 900 world-unit** rectangle, **Light on the west, Dark on the
east**, with named objectives (`north-west-objective`, …) and polygon bounds for the corner
regions, marked `TUNE: provisional shapes traced from the team's layout sketch`. Treat it as
**provisional data only**: under D7 those coordinates become either generator inputs (world
size, lane spacing, corner-region shape) or a preset under `content/maps/` that the generator
validates, never a hand-authored map that the code depends on. The east/west orientation is a
`GameConfig` value with the same status.

## Current map preview (2026-10-07)

The map owner's current brief preserves every square and the original three lane paths.
The public `MAP_1` applies an eightfold uniform presentation scale to the 1600 × 900 sketch,
producing a **12,800 × 7,200** battlefield. Original feature IDs, ownership and proportional
positions remain intact. `MapLayout` assembles this preview; it is not the planned configurable
simulation `MapGenerator`.

- North capture point (`north-crossing`): snowy stone fortress.
- Centre capture point (`grand-cathedral`): large cathedral surrounded by village streets,
  houses and market stalls.
- South capture point (`south-crossing`): basalt fortress with lava/forge accents.
- Twelve additional neutral camp clearings (six per side), with tents, supplies and fires;
  the four original corner objective squares are retained.
- Shared deterministic polygon scenery: varied tree canopies and pines, boulders, lakes, hills, and a perimeter field of overlapping mountains with varied sizes, summit positions, rock faces and occasional snow on taller peaks. Snow pockets surround the northern point; lava rivers and four bridges surround the southern point. Layered translucent fringes soften both biome transitions.
  Decorations are visual data and do not imply colliders, capture rules or enemy spawns.

The client preview supports drag panning, wheel zoom, minimap navigation and a world-overview
button. The top-left title has been removed. Huge fortified home bases retain the original west/east anchors, and the enlarged cathedral sits within an irregular village with winding streets. Clicking the cathedral opens its enlarged 1,800 × 2,200 interior (nave, pews, columns, chapels, library, sacristy, vestry, reliquary, garden cloisters and
altar). The interior is arranged around a circular rotunda with an open central capture court and rooms connected radially. The neutral interior capture anchor is at the world centre; capture rules remain future work. Entry starts at a 1.65× closer view; panning and wheel zoom reach the remaining rooms. The leave button returns outside. This is **presentation navigation**, pending the
future player movement, doorway and collision systems. No external assets or dependencies were
added. The original control-binding requirements still govern future gameplay input.

## Engineering notes

- `packages/core/src/map/`: `MapGenerator` (with a `MapBuilder` inside), `MapDefinition` types,
  `WorldMap` (runtime grid, nav cost grid, flow fields), `LaneGeometry`, symmetry helpers.
  Presets live in `content/maps/`.
- Single place of change: a new placed thing (say, a shrine) is one `Structure` or `Obstacle`
  subclass or content kind, one placement rule in the generator, one view registration. The
  minimap never changes.
- Straight lanes are an MVP simplification, not a model constraint: `LaneGeometry` is a
  polyline so curved lanes later are data.
- Determinism: the generator is pure (config + seed in, definition out) and is tested with
  golden hashes of the generated definition.

## Related

- [Architecture: map and minimap](../../architecture/06-map-and-minimap.md)
- [Architecture: structures, obstacles and destructibles](../../architecture/07-structures-obstacles-and-destructibles.md)
- [Structures and defences](03-structures-and-defenses.md)
- [Objectives, capture points and bosses](04-objectives-capture-points-and-bosses.md)
- [MVP scope](11-mvp-scope.md)
- [Open questions](12-open-questions.md)
- [Research: config-driven design](../../research/game-architecture-and-performance-research.md#9-config-driven-and-data-driven-design)
- [Verbatim source: Map](../source/game-project-eternalus-v2.md)
