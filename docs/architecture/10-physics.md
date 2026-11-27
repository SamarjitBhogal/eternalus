---
title: Physics
description: 2D top-down kinematics, momentum and knockback, carry weight, collision shapes, the SpatialHash broad phase, SAT and swept narrow phases, the CollisionResolver, deterministic math and the physics test plan. Read this before touching packages/core/src/physics/ or the Movement, Collider and Carry components.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-11-27
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
    'docs/decisions/0026-ability-framework.md',
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
  readonly speedLimit: number; // a cap below maxSpeed; Infinity while none is set
  limitSpeed(limit: number): void; // a shot slowing to its range (§7, DEC-314)
}
```

While `state.match.isIdleHeld` is set (the countdown, 12 §2) `MovementSystem` treats every
entity as `cannot-move`: the speed scale is 0 and no entity walks. Integration per tick
(`MovementSystem`, `dt = 1 / 30` s), in entity id order:

1. `dv = desiredVelocity − velocity`; clamp `|dv|` to `acceleration × dt` (acceleration-limited:
   a unit cannot change velocity faster than its stat allows, in any direction).
2. `velocity += dv`; `velocity += pendingImpulse / mass`; clear `pendingImpulse`.
3. If `desiredVelocity` is zero, apply friction: `velocity *= max(0, 1 − friction × dt)` (TUNE per
   definition; higher for units, lower for a sliding felled trunk).
4. Clamp `|velocity|` to the lower of `maxSpeed` and `speedLimit` (impulses may exceed it briefly: knockback then decays through
   friction and the acceleration clamp toward the desired velocity).
5. `previousPosition = position; position += velocity × dt; speed = |velocity|`.

Arrival is a steering concern: `PathingSystem` scales the desired speed down inside a slowing
radius so units stop on their target without overshooting (Reynolds' arrival).

**Momentum and knockback.** A push that is not a dash or a knock-back is an impulse `J` (a `Vec2`,
in mass × units/s) added to `pendingImpulse`; the velocity change is `J / mass`. Dashes and
knock-backs are forced motion instead: `Movement.push` spreads a displacement over a number of
ticks, and `MovementSystem` adds each tick's share to the walking step, so collision sweeps both
alike. A knock-back's content distance is for a target of base mass, a heavier target moves
less, and knock-backs that reach one target in the same tick add up as vectors (DEC-208; ADR
0026 decision 4). That gives the game doc's
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
tick by sorting the points by `cell × count + index`; a query binary-searches each covered row's
run of cells. No per-cell array is kept, so a rebuild costs what the points cost (O(n log n)), never the
`cols × rows` of the world, which on a generated map is hundreds of thousands of cells. A rebuild
allocates one sorted view, plus a larger key buffer when the point count first passes the
current capacity (grown once, then reused); queries never allocate.

```ts
export class SpatialHash {
  rebuild(positions: Float64Array, radii: Float32Array, count: number): void; // O(n log n); radii planned (§12)
  queryCircle(x: number, y: number, r: number, out: Int32Array): number; // count; id-sorted
  queryRect(rect: Rect, out: Int32Array): number; // planned (§12)
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
  Projectiles are swept by `ProjectileSystem`, not by the resolver's step 1: a shot is not pushed
  or slid, it ends at the first body or wall it touches (05 §10, DEC-314). Walls still come from
  the resolver's `CollisionQuery.reach`. The resolver's steps below are for units. An arc shot
  (`ProjectileFlight.isArc`, 05 §10, DEC-342) is the exception: `ProjectileSystem` does not sweep
  it while it flies, so no wall, body or map edge stops it. It moves to its range, which its
  attack set to the aim point, and lands there (`ArcLanding`). It is then ended and hits nothing
  more.
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

`CollisionSystem` runs before `PathingSystem` (§9) and calls the resolver once per tick:

1. **Swept vs unbreakable statics** for every unit flagged in §7 (walls, closed gates, bounds,
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

Order in `SystemPipeline`: `MovementSystem` → `CollisionSystem` → `SpaceSystem` → `StuckSystem` →
`PathingSystem` (DEC-121 (c): every later reader sees resolved positions).

- `PathingSystem` computes **next tick's** `desiredVelocity` from the positions just integrated:
  flow-field follow (bilinear interpolation of the four surrounding field vectors × `maxSpeed`),
  separation from neighbours found through `SpatialHash` (1/r weighted, id-sorted), arrival near
  the goal, combined by priority (wall avoidance, then separation, then a horde member's
  formation slot ([18](18-minion-system.md) §5), then flow) and truncated to
  `maxSpeed`. Legends (bots and click-to-move) use A* with an octile heuristic and string pulling
  on the same `WorldMap` grid; camp guards use seek/arrival inside their leash. A mob or bot
  Legend whose chase of its target is stuck follows A\* waypoints on that grid round the
  obstacle; `StuckSystem` finds it stuck and plans the waypoints ([18](18-minion-system.md) §5.2,
  DEC-193). One search
  settles at most `GameConfig.map.pathMaxSearchArea` of ground, an area in m², not a count of
  cells: the pathfinder divides it by its grid's cell area, so a change of `navCellSize` keeps the
  distance a search reaches (DEC-243).
- The one-tick latency between deciding and integrating is deliberate: it removes any ordering
  dependency between steering and integration (both read last tick's state), matches the "commands
  apply next tick" rule, and is invisible at 30 ticks/s.
- Steering only proposes; the resolver disposes. Units never accept a steering force that pushes
  them into a wall because step 1 of §8 always runs last on positions.
- A lane's field also covers the blocked cells of its corridor: every one reachable from open
  ground points the shortest way out, so a horde spawned inside its structure's footprint
  ([18](18-minion-system.md) §3.2) or a unit pushed into a wall is led back to open ground (MS-31).
- Flow fields rebuild time-sliced after terrain changes (`06-map-and-minimap.md` §6); ORCA is
  an optional `AvoidanceStrategy` if playtests show shuffling, not an MVP item.

## 10. Deterministic math

- `+ − × ÷` and `Math.sqrt` are IEEE-exact and reproducible; `Math.sin/cos/atan2/pow/exp` are
  implementation-dependent across browsers. `utils/deterministicMath.ts` wraps them with our own
  polynomial approximations and is the only module allowed to call them (a lint rule guards
  `packages/core`).
- Steering and aiming work with vectors, never angles: facing is a unit vector, rotation is a
  2 × 2 multiply, "turn toward" is a normalised lerp. `atan2` is for display only (client side).
  Facing turns at once in core (DEC-192: facing is the movement direction; `Transform.face`,
  `Transform.lookAt`); the client draws a normalised lerp between ticks ([08](08-game-engine.md) §8).
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

`physics/SpatialHash` (minion plan M1, M2a) has §5's `rebuild` and an exact, ascending
`queryCircle`, over points only: no radii and no `queryRect` yet.
`physics/SpaceIndex` wraps it as `state.space` (11 §3), rebuilt by `SpaceSystem` after
`MovementSystem`.

Flow-field follow (§9, minion plan M4) is built for lane hordes: `LaneFollowMovementStrategy` takes
the bilinear field direction instead of its slot while the next `blockedLookAhead` (content) of the
straight line to the slot crosses an unwalkable cell, and a mob standing on unwalkable ground takes
it whether it marches or chases (18 §5.2). There is no `CollisionSystem` and no wall-avoidance term
yet; until they arrive, a heading that would enter unwalkable ground turns along its open grid axis
(18 §5.2, MS-35), and the field's blocked corridor cells (§9) lead a unit that still enters one
back out.

**2026-10-27 (PR #30, map objects).** Map-enabled simulations built with `mapObjects` now have a
`CollisionSystem`: it resolves moving circles against authored polygon footprints after movement. `StaticCollisionIndex` provides a grid broad phase;
`CollisionResolver` sweeps edges and vertices and slides along contacts. Building entrances are
gaps in the same wall geometry used for drawing. Bridge decks permit passage across terrain
while retaining collision at their sides. Destroyed object IDs disable their static footprints.
Unit-to-unit momentum, SAT and the remaining physics described above are still planned.

**2026-11-27 (`fix/tower-orbs-windows-timeout`, PR #168).** `WorldObjectStore.blockingAt` (the
check behind `NoMapObjectOverlapInvariant`, separate from the collision solver) has its own lazy
grid of record boxes, with the same cell scheme as `StaticCollisionIndex`. One shared box grid in
`utils/` for both is a better-than-design item that waits for the owner's sign-off (`INBOX.md`
HC-B67).

**2026-11-13, updated 2026-11-14 (`feat/ability-framework`, ADR 0026 decision 4).** `Movement` has `push` and
`takeForcedStep` for dashes and knock-backs; it has no `pendingImpulse` or `desiredVelocity` (a
heading set by `steer`). Forced motion moves an entity that `cannot-move` (Slam knocks back and up
at once) and waits while the match holds units idle. The knock-back's base mass and travel time are
in `content/abilities/knockback.ts` (`TUNE`); `loadKnockback` converts the travel time to ticks at
load (03 §8, DEC-241). A dash's hit path is cut at cast where the caster's
circle first touches a wall or the map's edge (`abilities/dashReach.ts`): one straight sweep
(`CollisionResolver.reach`, §7's swept test without the slide, cut at the map's bounds) by the
same `CollisionResolver` `CollisionSystem` moves units with. `Simulation` builds one per match on
the one `StaticCollisionIndex` (`map/staticCollisionIndexOf.ts`) and the map's bounds, so the
bounds clamp lives once, inside it, and hands it to `abilities/` as `GameState.collisions` (the
`CollisionQuery` port, beside `space` and `paths`). A destroyed object leaves the index when its
entity is removed, so walking and a dash stop seeing it at once. The dash's motion goes through
`MovementSystem` and `CollisionSystem` like walking.

**2026-11-20 (branch `feat/ranged-attacks`, PR 1; DEC-300, DEC-314).** Projectiles are swept every
tick (§7) by `systems/ProjectileSystem`, which runs just before `CombatSystem`. The swept segment
runs from the previous to the current position. It finds the earliest contact with a live enemy
body (`physics/sweepDisc` for circles, `sweepCircle` for outlines) and with a wall or the map edge
(`state.collisions.reach`). A body up to `BODY_BEFORE_WALL_MARGIN`
(`state/CollisionQuery.constants.ts`, which `LineOfFire` predicts shots by too) past where `reach`
stops takes the hit (`reach` already stops `CONTACT_EPSILON` short of the wall;
`state/isTouchedBeforeWall`, DEC-317 (6)). Two bodies touched at once go to the first in store
order, but the shot's target takes a tie within the same margin, so a palace wall whose face is the
Stronghold's edge does not take a shot fired at the Stronghold (DEC-317 (8)). Bodies are gathered
once a tick, in store order, and each move tests a body's box before its exact shape (the broad
phase); a body spawned during the tick is seen from the next tick. A walk-on outline (a palace
floor, a gate's passage: `Footprint.isWalkOn`, `MapObjectBody.isWalkOn`) and a body whose
collider is unbreakable (DEC-317 (5)) are hit only by a shot fired at their entity.
`CollisionSystem` skips the `projectile` layer. A shot with nothing in its path is slowed by
`Movement.limitSpeed` (`physics/flightSpeed`, from `slowFrom`) so it stops exactly at its `range`;
it then ends and hits nothing until it is removed (`ProjectileFlight`, DEC-306).

**2026-11-22 (branch `feat/melee-sweeps`, PR 2; DEC-317 addendum, DEC-322).** One rule decides
which body stops a shot: `state/AreaHitQuery.stopsShot`, which `ProjectileSystem` and `LineOfFire`
both use. This replaces two parts of the 2026-11-20 note above. A body whose collider is
unbreakable now stops every shot and takes no damage (DEC-317 addendum). A walk-on outline still
lets a shot fly over unless the shot aims at it: its locked target, or the walk-on body its aim
point names (`AreaHitQuery.aimedBodyOf`, DEC-322 (1)). The last move up to `range` is swept like any
other, so a body under the end point takes the hit: an arrow damages what it lands on (DEC-322 (2)).

**2026-11-22 (branch `feat/wall-turrets`, part 2; DEC-334).** The launch-shape rule: a shot is
not stopped by a blocking shape whose blocking area holds its launch point; the shot can only
leave that shape. The blocking area is the shape's polygon outside its passages, as
`CollisionResolver.startsInside` and `WorldObjectStore.blockingAt` read it. So a unit on a bridge
still has its shot stopped by the lava beside the deck. "Holds" means the launch point, not the
shot's circle: a shot whose circle touches a wall at launch is still stopped there. A launch point
on the polygon's edge is held too (within `CONTACT_EPSILON`, `utils/geometry`
`isPointInBlockingArea`). A wall turret stands on the joint of two wall pieces, and the even-odd
point test gives a point on a shared edge to one piece at most. Without the edge, the other piece
stopped every bolt that flew into it, and `NoMapObjectOverlapInvariant` flagged the bolt at launch
(12 of the 20 turrets on each of the seed 1 to 8 maps).
Known limit (a map bug from before PR 4; Owner Calls card HC-Q95, owner call pending): blocking
corner mountains (`map/MapMountainBuilder`) can cover a fort's wall ring. A mountain covers turret
0 of each side on each of the seed 1 to 8 maps, the lane gate on seeds 3 and 5 to 8, and turret 1
or 9 on some seeds. Where a mountain holds a turret's centre (turret 0 on seeds 3 to 8, turret 1 on
seeds 3, 6 and 8, turret 9 on seed 6), that turret's bolts ignore that mountain for their whole
flight. Where the mountain's edge is nearer than a bolt's radius (seed 2: 0.04 m), the mountain
stops the bolts fired into it at launch. A new bolt also stays at the turret's centre until the
next tick (`ProjectileSystem` runs before `CombatSystem`), so `NoMapObjectOverlapInvariant` flags
every bolt of that turret, in any direction. The client's release setting logs one ERROR for each
such bolt. Turrets fired no bolts before PR 4, so this log is new. The fix is in the map: keep
blocking terrain off the wall ring.
`CollisionQuery.reach` takes the launch point as an optional argument. `ProjectileSystem` passes
the shot's `origin`, and `LineOfFire` passes the attacker's centre, so line of fire and shots keep
one stop rule (DEC-317 B9). `NoMapObjectOverlapInvariant` passes a shot's origin to
`WorldObjectStore.blockingAt`, which skips such a shape too. A unit's centre is never in a blocking
area (the invariant), so the rule changes only wall turret bolts, which start at the turret's
centre inside its pylon and wall (07 §13). The body stop (`AreaHitQuery.stopsShot`) is unchanged:
on the seed 1 to 8 maps, every body outline that holds a turret's centre is on the turret's team
(a scenario test checks each seed). The rule assumes a convex launch shape: the shape is skipped
for the whole flight, so a shot that leaves a concave shape and enters it again is not stopped by
it. A pylon is a convex 12-gon. The wall pieces under a turret are launch shapes too, and they are
not convex: each is an arc band (`map/wallRing` `arcFootprint`). So a bolt that leaves its own wall
piece toward the court can cross that piece again further along the ring and pass through it. The
ring's size puts that second crossing far from the turret, near the end of the bolt's range (not
measured). The sentence in §4 that concave footprints are split into convex colliders does not hold
for wall pieces; that was so before PR 4.

**2026-11-23 (branch `feat/tower-orbs`; DEC-342).** Both wall turret bolts and the tower orb are
arc shots (`ProjectileFlight.isArc`, 05 §10). `ProjectileSystem` does not sweep an arc shot while
it flies (§7), and `NoMapObjectOverlapInvariant` skips it. So three statements of the 2026-11-22
DEC-334 note no longer hold for the bolts: a mountain at a turret does not stop its bolts at
launch, the invariant does not flag them, and the release client logs no ERROR for them. No shot
in play uses the launch-shape rule now: a unit's centre is never in a blocking area, and every
shot that starts inside one is an arc shot. The rule stays: `LineOfFire` and straight shots keep
it, and a straight orb (the owner chose the arc, DEC-366) would need it. The corner mountains on the
wall ring (HC-Q95) still need the map fix; they no longer show as bolt errors.

## Related

- [04 Entity architecture](./04-entity-architecture.md)
- [06 Map and minimap](./06-map-and-minimap.md) (`WorldMap`, flow fields)
- [07 Structures, obstacles and destructibles](./07-structures-obstacles-and-destructibles.md)
- [08 Game engine](./08-game-engine.md) (budgets, snapshot spatial index)
- [11 Game AI](./11-game-ai.md) (`PathingSystem`, controllers)
- [15 Diagnostics and runtime testing](./15-diagnostics-and-runtime-testing.md)
- [Research: game architecture and performance](../research/game-architecture-and-performance-research.md)
- [Reference: entities and units](../reference/game-design/02-entities-and-units.md)
