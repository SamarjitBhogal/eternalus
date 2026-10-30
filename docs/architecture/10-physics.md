---
title: Physics
description: 2D top-down kinematics, momentum and knockback, carry weight, collision shapes, the SpatialHash broad phase, SAT and swept narrow phases, the CollisionResolver, deterministic math and the physics test plan. Read this before touching packages/core/src/physics/ or the Movement, Collider and Carry components.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-29
tags: [architecture, physics, collision, movement, determinism]
paths:
  [
    'packages/core/src/physics/**',
    'packages/core/src/components/Movement*',
    'packages/core/src/components/Collider*',
    'packages/core/src/components/Carry*',
    'packages/core/src/systems/MovementSystem*',
    'packages/core/src/systems/CollisionSystem*',
    'packages/core/src/utils/deterministicMath*',
  ]
related:
  [
    'docs/architecture/04-entity-architecture.md',
    'docs/architecture/06-map-and-minimap.md',
    'docs/architecture/07-structures-obstacles-and-destructibles.md',
    'docs/architecture/11-game-ai.md',
    'docs/research/game-architecture-and-performance-research.md',
  ]
---

# Physics

**Purpose.** Read this when you move something, stop something from passing through something
else, or push something around: unit movement, knockback, projectiles, dashes, walls, obstacles
and the checks that log any pass-through. Physics lives in `packages/core/src/physics/` (L2) and
runs inside `MovementSystem` and `CollisionSystem`; it is 2D, deterministic and allocation-free in
its hot loops. Numbers are `TUNE` values from the game doc or **Recommendations**; code is a sketch.
Sources: [research §1](../research/game-architecture-and-performance-research.md#1-fixed-timestep-interpolation-and-determinism),
[§3](../research/game-architecture-and-performance-research.md#3-pathfinding-and-movement-for-lane-minions-and-large-unit-counts)
and [§4](../research/game-architecture-and-performance-research.md#4-spatial-partitioning-and-collision).

## 1. Scope and units

- **2D top-down.** Positions are `Vec2` in world units; there is no vertical axis in the MVP.
  `Transform.height` exists as a scalar reserved for the Flying class, `Grasp` drops and
  `Firestorm` altitude (**post-MVP**); the MVP never reads it.
- **World unit.** 1 world unit = 1 metre ([DEC-06](../reference/game-design/13-owner-decisions-log.md)).
  It makes the game doc's sizes and speeds ("N m/s") usable directly and keeps tuning legible;
  rendering scales through `Camera`. The map's world size (`MapConfig`, `06` §2) is in metres too.
- **Character sizes.** The game doc gives heights: Warrior ~7 ft (Master Chief), Magus ~10 ft
  (Hades), Sentinel ~15 ft (an elephant). A top-down footprint radius is what physics needs:

| Unit                    | Height (game doc)      | Footprint radius (TUNE; Legends per DEC-06, others **Recommendation**) | Notes                                 |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| light minion            | (smaller than Warrior) | 0.4 m                                                                  | horde of 16                           |
| Warrior / medium minion | ~7 ft (2.1 m)          | 0.5 m                                                                  | "a little bigger than a light minion" |
| Magus / heavy minion    | ~10 ft (3.0 m)         | 0.75 m                                                                 | "equivalent in size to Heavy minions" |
| Sentinel                | ~15 ft (4.6 m)         | 1.25 m                                                                 | largest unit; sets the hash cell size |
| projectile (bolt)       | n/a                    | 0.15 m                                                                 | swept, never overlap-tested only      |

Radii are `Collider` content per definition; systems never contain a size.

## 2. Kinematics (`Movement`)

```ts
// packages/core/src/components/Movement.ts (sketch)
export class Movement {
  speed: number; // current |velocity|, kept for cheap reads (sprint checks, HUD)
  readonly maxSpeed: number; // content
  readonly acceleration: number; // content, units/s²
  readonly mass: number; // content, kg-like; divides impulses
  readonly velocity: MutableVec2;
  readonly desiredVelocity: MutableVec2; // written by PathingSystem/controllers for the NEXT tick
  readonly pendingImpulse: MutableVec2; // accumulated by abilities/combat this tick
}
```

Integration per tick (`MovementSystem`, `dt = 1 / 30` s), in entity id order:

1. `dv = desiredVelocity − velocity`; clamp `|dv|` to `acceleration × dt` (acceleration-limited:
   a unit cannot change velocity faster than its stat allows, in any direction).
2. `velocity += dv`; `velocity += pendingImpulse / mass`; clear `pendingImpulse`.
3. If `desiredVelocity` is zero, apply friction: `velocity *= max(0, 1 − friction × dt)` (TUNE per
   definition; higher for units, lower for a sliding felled trunk).
4. Clamp `|velocity|` to `maxSpeed` (impulses may exceed it briefly: knockback then decays through
   friction and the acceleration clamp toward the desired velocity).
5. `previousPosition = position; position += velocity × dt; speed = |velocity|`.

Arrival is a steering concern: `PathingSystem` scales the desired speed down inside a slowing
radius so units stop on their target without overshooting (Reynolds' arrival).

**Momentum and knockback.** Every push is an impulse `J` (a `Vec2`, in mass × units/s) added to
`pendingImpulse`; the velocity change is `J / mass`. That single rule gives the game doc's
class feel from content alone: the **Sentinel** has low `acceleration`, one of the highest
`maxSpeed`s and a high `mass`, so it starts slowly, keeps its momentum, and barely moves when hit;
the game doc's "up to 1 minute of running straight to get to full speed" is simply
`maxSpeed / acceleration ≈ 60 s` (TUNE). Knockback reduction (the Eternal form) is a multiplier
on incoming impulses in `StatusEffects`, not a special case in physics. The wall sprint-through
rule (`07-structures-obstacles-and-destructibles.md` §3) reads `speed >= maxSpeed ×
fullSpeedFraction`; physics only reports speed.

## 3. Weight and carry (`Carry`)

```ts
export class Carry {
  readonly capacity: number; // content: Warrior low, Magus medium, Sentinel high (TUNE)
  carriedId: EntityId | null;
  carriedWeight: number; // 0 when empty
}
```

`PickUpStrategy` (per class: Pick Up / Levitate / Grab) checks `target.weight <= capacity`;
while carrying, `MovementSystem` multiplies `maxSpeed` by `1 − slowdownPerWeightRatio ×
carriedWeight / capacity` (TUNE; "the heavier the object, the slower you move"). A carried entity's
collider is disabled and its `Transform` follows the carrier; throwing gives it an impulse and
re-enables the collider with a swept test on the first tick. Picking up units is **post-MVP**;
felled trunks and wall chunks are **MVP-if-time**.

## 4. Collision shapes and the `Collider` component

```ts
// packages/core/src/physics/shapes.types.ts (sketch)
export type Circle = { readonly kind: 'circle'; readonly radius: number }; // centre = Transform
export type ConvexPolygon = {
  readonly kind: 'polygon';
  readonly vertices: readonly Vec2[]; // world space, counter-clockwise, ≤ 8 vertices (TUNE)
  readonly normals: readonly Vec2[]; // precomputed edge normals for SAT
  readonly bounds: Rect; // AABB for cheap rejection
};
export type CollisionLayer = 'unit' | 'structure' | 'obstacle' | 'projectile';
export class Collider {
  readonly shape: Circle | ConvexPolygon;
  readonly layer: CollisionLayer;
  readonly isStatic: boolean; // structures, obstacles, walls: never moved by the resolver
  isUnbreakable: boolean; // set by StructureSystem from the BreakabilityRule
  isEnabled: boolean; // false while carried, dead, or a gate is open
}
```

Units and projectiles are circles (cheap, rotation-free); structures, obstacles and wall segments
are convex polygons (concave footprints are split into several convex colliders by the
generator). `Zone`s have no collider.

## 5. Broad phase: `SpatialHash`

Uniform grid over the map, cell size = the largest unit diameter (from the radii above,
TUNE) so a query touches only the 9 surrounding cells. Storage is dense typed arrays rebuilt every
tick by counting sort (Muller's layout): `cellStart: Int32Array(cols × rows + 1)`,
`entries: Int32Array(maxEntities)`; zero allocation after construction.

```ts
export class SpatialHash {
  rebuild(positions: Float64Array, radii: Float32Array, count: number): void; // O(n)
  queryCircle(x: number, y: number, r: number, out: Int32Array): number; // count; id-sorted
  queryRect(rect: Rect, out: Int32Array): number;
}
// Polygons of structures, obstacles and walls; rebuilt only when terrain changes.
export class StaticColliderIndex {}
```

The hash is a physics-owned structure fed from component arrays, not stored in entities (the
research's ECS-FAQ advice); `SnapshotSystem` copies its tables into the snapshot so views cull
with the same index (`08-game-engine.md` §4).

## 6. Narrow phase

- **Circle–circle (unit–unit).** For each pair `(a, b)` with `a.id < b.id` from the hash:
  `d = |pb − pa|`, `overlap = ra + rb − d`; if `overlap > 0` push apart along the centre line, split
  by inverse mass (`a` moves `overlap × mb / (ma + mb)`), a static or heavier body moves less.
  Coincident centres use a fixed axis `(1, 0)` (never a random one) to stay deterministic.
- **Circle–polygon (unit–structure, unit–obstacle, projectile–structure).** SAT: project onto each
  polygon edge normal plus the axis from the polygon's closest vertex to the circle centre; the
  smallest overlap gives the minimum translation vector (MTV); move the circle by the MTV and
  project its velocity onto the contact tangent so units slide along walls (SupCom 2 behaviour).
- **Polygon–polygon** is not needed in the MVP (statics never move); the SAT routine supports it
  for later (thrown wall chunks).

All contact math lives in `physics/narrowPhase.ts` as pure functions over shapes and positions;
`CollisionResolver` decides what to do with the results.

## 7. Swept tests and tunnelling detection

Fast movers can jump over a thin wall in one 33 ms tick (a bolt at 60 m/s moves 2 m per tick).
Overlap tests are therefore not enough:

- **Always swept**: projectiles and dashes (`Blade Runner`, `Meteor Fall` landing, Sentinel
  sprint). **Swept when fast**: any unit whose displacement this tick exceeds its radius.
- The test casts the segment `previousPosition → position` (expanded by the circle's radius, i.e.
  a capsule) against `StaticColliderIndex` entries flagged `isUnbreakable`, plus closed gates and
  map bounds; the earliest time of impact `t ∈ [0, 1]` wins; the mover is placed at
  `previous + (position − previous) × t` minus a small skin (TUNE) and its velocity is projected
  onto the tangent (or the projectile is resolved as a hit).
- **Anomaly detection** (the requirements doc's runtime check): after resolution the segment is
  re-cast; if it still crosses an unbreakable collider, `CollisionSystem` emits
  `collision-anomaly { entityId, tick, from, to, colliderId }`. The
  `NoPassThroughUnbreakableInvariant` logs it through `Logger`; tests assert it never fires. This is Box2D's shape-cast
  advice applied as an assertion rather than as a physics feature.

## 8. `CollisionResolver` ordering and iteration count

`CollisionSystem` runs after `PathingSystem` and calls the resolver once per tick:

1. **Swept vs unbreakable statics** for every mover flagged in §7 (walls, closed gates, bounds,
   unbreakable obstacles). Positions are corrected to the time of impact first so nothing below
   can push a unit through a wall.
2. **Push-out vs breakable statics** (structures, breakable obstacles, breakable walls) with SAT
   MTV; a Sentinel's `AttackStrategy` may answer `pass-through` here (§2, `07` §3).
3. **Unit–unit separation**: circle push-out over all hash pairs in id order, repeated
   `iterations` times (**Recommendation:** 2, TUNE; more passes tighten dense hordes at linear cost).
4. **Re-check** step 1's segments (the anomaly test) and write positions back.

Step order is the invariant that keeps walls solid: statics before dynamics, unbreakable before
breakable, and the same order every tick. The resolver is a class with injected phases
(`readonly phases: readonly ResolverPhase[]`), so a future `OrcaAvoidancePhase` slots in without
editing the resolver (OCP).

**`unbreakable` semantics.** `Collider.isUnbreakable === true` means: never damaged (the
`DamagePipeline` rejects it), never passable (swept-tested), never removed except by a
`RemovalCause` of kind `map-change`. `false` means breakable: passable only once the entity is
destroyed and its collider removed through `DeathSystem`; until then it blocks like a wall.
Breakability changes at runtime through `StructureSystem` (`07` §3), never in physics.

## 9. Steering and pathing interplay

Order in `SystemPipeline`: `MovementSystem` → `PathingSystem` → `CollisionSystem`.

- `PathingSystem` computes **next tick's** `desiredVelocity` from the positions just integrated:
  flow-field follow (bilinear interpolation of the four surrounding field vectors × `maxSpeed`),
  separation from neighbours found through `SpatialHash` (1/r weighted, id-sorted), arrival near
  the goal, combined by priority (wall avoidance, then separation, then a horde member's
  formation slot ([18](18-minion-system.md) §5), then flow) and truncated to
  `maxSpeed`. Legends (bots and click-to-move) use A* with an octile heuristic and string pulling
  on the same `WorldMap` grid; camp guards use seek/arrival inside their leash.
- The one-tick latency between deciding and integrating is deliberate: it removes any ordering
  dependency between steering and integration (both read last tick's state), matches the "commands
  apply next tick" rule, and is invisible at 30 ticks/s.
- Steering only proposes; the resolver disposes. Units never accept a steering force that pushes
  them into a wall because step 1 of §8 always runs last on positions.
- Flow fields rebuild time-sliced after terrain changes (`06-map-and-minimap.md` §6); ORCA is
  an optional `AvoidanceStrategy` if playtests show shuffling, not an MVP item.

## 10. Deterministic math

- `+ − × ÷` and `Math.sqrt` are IEEE-exact and reproducible; `Math.sin/cos/atan2/pow/exp` are
  implementation-dependent across browsers. `utils/deterministicMath.ts` wraps them with our own
  polynomial approximations and is the only module allowed to call them (a lint rule guards
  `packages/core`).
- Steering and aiming work with vectors, never angles: facing is a unit vector, rotation is a
  2 × 2 multiply, "turn toward" is a normalised lerp. `atan2` is for display only (client side).
- Fixed iteration order everywhere: entities in store (creation) order (DEC-20), hash query results
  sorted by id, pairs `(a < b)`, comparators that tie-break by id, no `Map` iteration in hot paths.
- No `Math.random` in physics; the only randomness (jitter for coincident
  centres if ever needed) comes from the seeded `Rng` owned by `GameState`.
- Same machine, same browser: replays are bit-exact and `Simulation.hash()` proves it;
  cross-browser exactness is what the wrappers buy. Fixed-point integers are not needed unless the
  game becomes networked lockstep.

## 11. Tests (`packages/core/src/physics/*.test.ts`)

- **Unit**: SAT separating/overlapping cases with known MTVs; circle push-out is symmetric and
  mass-weighted; swept segment hits report the earliest `t`; a 2 m-per-tick bolt never crosses a
  0.5 m wall; coincident centres resolve identically on every run.
- **Property-style with seeds** (no new dependency: a loop over seeds): for `seed in 1..50`,
  scatter 300 circles and 40 polygons from the seeded `Rng`, run 300 ticks with random desired
  velocities, and assert after every tick: no unit–unit overlap beyond `epsilon`, no unit inside an
  unbreakable polygon, zero `collision-anomaly` events, `|velocity| <= maxSpeed + impulse bound`,
  and that mirroring the whole scene across the map axis mirrors the outcome exactly (the map's
  symmetry invariant carried into physics).
- **Determinism**: the same seed and command log twice produce identical `hash()` values every
  30 ticks; a differently ordered entity list (shuffled insertion, same ids) produces the same.
- **Soak** (`npm run test:soak`, explicit timeout): 20,000 ticks with 288 minions marching in
  both directions plus 20 Legends; zero anomalies; hash/field buffers are never reallocated
  (counters flat); p95 tick time recorded for the `08` budget table.
- **Regression**: every replay-found bug adds a fixture (seed + commands + expected hashes).

## 12. Implementation status

`physics/SpatialHash` (minion plan M1) is a uniform grid with linked-list cells:
`insert(index, x, y)` per tick and `collectNear(x, y, radius, out)`, which yields items in reverse
insert order per cell (each cell is a LIFO list), not §5's `rebuild` / `queryCircle` with id-sorted results. It is deterministic
(insert order follows store order). Horde separation (18 §5.2) falls off linearly with distance,
not as 1/r. Both conform when `Perception` (minion plan M2) needs id-ordered queries.

Flow-field follow (§9, minion plan M4) is built for lane hordes: `LaneFollowMovementStrategy` takes
the bilinear field direction instead of its slot while the next `blockedLookAhead` (content) of the
straight line to the slot crosses an unwalkable cell. There is no `CollisionSystem` and no
wall-avoidance term yet; until they arrive, the blocked corridor cells beside open ground point
back out of it, so the field itself leads a unit pushed into a wall back to open ground.

## Related

- [04 Entity architecture](./04-entity-architecture.md)
- [06 Map and minimap](./06-map-and-minimap.md) (`WorldMap`, flow fields)
- [07 Structures, obstacles and destructibles](./07-structures-obstacles-and-destructibles.md)
- [08 Game engine](./08-game-engine.md) (budgets, snapshot spatial index)
- [11 Game AI](./11-game-ai.md) (`PathingSystem`, controllers)
- [15 Diagnostics and runtime testing](./15-diagnostics-and-runtime-testing.md)
- [Research: game architecture and performance](../research/game-architecture-and-performance-research.md)
- [Reference: entities and units](../reference/game-design/02-entities-and-units.md)
