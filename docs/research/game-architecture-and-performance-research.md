---
title: Architecture and performance techniques for a Canvas 2D lane-based MOBA/RTS hybrid in TypeScript
description: Sourced findings on fixed-timestep determinism, entity hierarchies versus ECS, flow-field pathfinding and steering, spatial partitioning and collision, Canvas 2D rendering, object pooling, bot AI, Web Workers and data-driven content; read before designing or optimising the simulation, physics, rendering or AI.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [research, architecture, performance, determinism, pathfinding, physics, rendering, ai]
related:
  - 'docs/research/README.md'
  - 'docs/research/works-cited.md'
  - 'docs/architecture/03-game-model.md'
  - 'docs/architecture/04-entity-architecture.md'
  - 'docs/architecture/10-physics.md'
  - 'docs/architecture/11-game-ai.md'
---

# Architecture and performance techniques for a Canvas 2D lane-based MOBA/RTS hybrid in TypeScript

Research report for the Eternalus team. Written 2026-09-30. Every source below was fetched on
2026-09-30; bracketed numbers refer to the "Works cited" list at the end, which gives the URL,
author/publisher and the date shown on the page (or "undated" when the page shows none).

Scope reminder (from `docs/architecture/` and `AGENTS.md`): pure-TypeScript simulation in
`packages/core` stepped at a fixed 30 ticks/s, rendered at display rate through a single
`Renderer` that owns the Canvas 2D context, commands from input and bots applied on the next
tick, a seeded RNG, no `Math.random`/`Date`/timers in core, content keyed by kebab-case IDs, and
systems that communicate through typed `GameEvents`. The recommendations below are written to fit
those rules, not replace them.

## Summary

- Keep the accumulator loop exactly as planned (fixed `dt`, render interpolation with
  `alpha = accumulator / dt`, a clamp on how much time a frame may consume). This is the canonical
  Fiedler/Nystrom design; both explicitly call the clamp the defence against the "spiral of
  death" [1][12].
- On one machine and one engine, JavaScript doubles are deterministic; the real replay killers
  are `Math.random` (unseedable), wall-clock reads, iteration over collections whose insertion
  order depends on timing, ill-formed sort comparators, and the transcendental `Math.*` functions,
  whose precision is implementation-dependent and can differ between browsers or even CPUs
  [5][6][7][8][9]. Add a per-tick state checksum so divergence is detected early [3][61].
- Use a shallow hierarchy (`Entity → Unit → Legend/Mob/NeutralEntity`, `Entity → Structure →
Tower/Wall/Gate/Turret`; never deeper than three) whose behaviour lives in components and
  strategies, with per-domain systems owning the update loops. This is the "Entity-Component"
  (EC) style used by 0 A.D., OpenRA, Unity and Excalibur, not a data-oriented ECS, and it is
  the right fit for a student team with an OOP/SOLID mandate [11][13][14][61][63][65].
- Drive unit "kinds" with the Type Object pattern: one `Entity` class per family, one immutable
  definition object per content ID (`LegendDefinition`, `MobDefinition`, `StructureDefinition`)
  with optional single-parent data inheritance; that is exactly how OpenRA's `TraitInfo` and
  0 A.D.'s entity templates work [15][28][61][63].
- Move hordes with one flow field per (lane, team) computed by BFS/Dijkstra from the goal over
  the walkable grid, rebuilt (time-sliced) only when destructible terrain changes, plus
  Reynolds steering (flow-field-follow, separation, arrival) fed by a spatial hash; reserve A*
  for the ~20 Legends [30][31][32][33][34].
- Broad phase: a uniform grid / spatial hash with cell size equal to the largest unit diameter
  (9-cell neighbourhood queries, dense `Int32Array` storage) [26][36]. Narrow phase: circle-circle
  for units, SAT (with the closest-vertex axis) for circle-vs-polygon structures [37][38].
  Tunnelling is a real risk for fast projectiles and dashes; do a segment/swept test against
  unbreakable colliders and log any pass-through, which mirrors Box2D's "bullet" CCD advice [39].
- Rendering: three canvases (static terrain, entities, overlay), pre-rendered terrain chunks,
  integer draw coordinates, no `drawImage` scaling at draw time, `alpha:false` on the base
  layer, DPR-aware sizing, viewport culling, and `requestAnimationFrame` [40][41][42][43][44].
- Allocation discipline: V8's generational GC makes short-lived garbage cheap but not free;
  pools for projectiles/particles/events, pre-allocated typed arrays for fields and grids, and
  struct-of-arrays layouts only where profiling shows a hot loop [25][45][14][27].
- Bots: FSM/HFSM for minions and structures, behaviour trees ticked at a reduced cadence (the
  BT literature reports "every other frame or at 5 Hz") for Legend bots, utility scoring for
  target and ability choice; GOAP/HTN are not worth it here [48][49][50]. Copy the published
  MOBA aggro rules (acquisition radius, priority list, re-evaluation between attacks, aggro
  duration/cooldown) as data [51][52][53].
- Do not move the simulation to a Web Worker in the first milestone. `postMessage` cost scales
  with payload size (Surma's rule of thumb: under 10 KiB per message is safe for animation
  budgets), transferables are zero-copy, and `SharedArrayBuffer` needs cross-origin isolation
  headers; design snapshots so the move is possible later [54][55][56][47].

## 1. Fixed timestep, interpolation and determinism

### Findings

Fiedler's "Fix Your Timestep!" is the origin of the accumulator design the team already planned.
Its argument: a variable `dt` makes simulation behaviour depend on frame rate and can make
springs explode and fast objects tunnel; a semi-fixed step bounds `dt` but still leaves a
remainder step that breaks exact reproducibility; the fix is "the renderer produces time and the
simulation consumes it in discrete dt sized steps", keeping leftover time in an accumulator and
rendering `previous * (1 - alpha) + current * alpha` with `alpha = accumulator / dt` [1]. Two
safeguards against the spiral of death (simulation falling further behind the more it tries to
catch up) are given: leave headroom so a tick costs much less than `dt` of real time, and clamp
either the frame time (his example caps it at 0.25 s) or the number of steps per frame, which
makes the game slow down instead of locking up [1]. In "Deterministic Lockstep" he limits catch-up
to 4 simulated frames per render frame for the same reason [3]. Nystrom's Game Loop chapter
describes the same "play catch up" loop, passes `lag / MS_PER_UPDATE` to `render()`, and notes
that in a browser the platform owns the loop, so `requestAnimationFrame` is the game loop [12].

Why 30 ticks/s under a 60 Hz display works: with `dt = 33.3 ms` and frames arriving every
16.7 ms, the accumulator alternates between running one tick and none, so `alpha` alternates
between roughly 0 and 0.5 and the interpolated render shows the intermediate position; this is
exactly the mismatched-rate case Fiedler uses to motivate interpolation [1]. MDN warns that
`requestAnimationFrame` frequency follows the display (60, 75, 120, 144 Hz are all common) and
that callbacks are paused in background tabs, which is why the frame-time clamp matters: after a
tab returns from the background the accumulator would otherwise demand thousands of ticks [44].

Floating point: Fiedler's survey concludes IEEE 754 arithmetic is deterministic for the same
sequence of operations on the same machine and build ("if you are doing the same sequence of
floating point calculations on the same initial inputs, then things should be replayable exactly
just fine"), that cross-machine determinism needs the same instruction set and compiler, and that
transcendental functions (sin, cos, tan) historically differed between AMD and Intel
implementations; the Supreme Commander engineers report shipping deterministic peer-to-peer RTS
netcode on floats by pinning FPU precision and rounding modes [2]. "Deterministic Lockstep"
defines determinism as bit-exact ("you could take a checksum of your entire physics state at the
end of each frame and it would be identical") and shows a physics engine that diverged only
because its solver used an unseeded RNG [3]. 0 A.D. goes further for its cross-platform lockstep:
serialized simulation state "must be identical regardless of the compiler, OS, CPU" and therefore
"must not include e.g. size_t values ... or floats (we don't trust compilers to treat them
precisely)", and it checksums the simulation state to detect out-of-sync [61].

### Determinism pitfalls specific to JavaScript

| Pitfall                                | What the sources say                                                                                                                                                                                                                                                                                                                        | Mitigation for `packages/core`                                                                                                                                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Math.random()`                        | The seed "cannot be chosen or reset by the user" [5]; engines implement it differently (V8 moved from MWC1616 to xorshift128+ in 2015) [7].                                                                                                                                                                                                 | One seeded PRNG owned by `GameState`; small, seedable 32-bit generators such as `sfc32`, `splitmix32` or `mulberry32` are documented with JS code and quality notes (sfc32 passes PractRand; mulberry32 is fast but skips a third of 32-bit outputs) [10]. Seed it from the match seed and never share it with rendering/UI code. |
| Transcendental `Math.*`                | "Many Math functions have a precision that's implementation-dependent... different browsers can give a different result. Even the same JavaScript engine on a different OS or architecture can give different results!" [6]. `+ - * /` and `Math.sqrt` are IEEE operations and reproducible given identical inputs and operation order [2]. | Same machine, same browser: replays are exact. For cross-browser replay/tests, wrap `sin/cos/atan2/exp/pow` behind `core/utils/math` and implement them with your own deterministic approximations (tables or polynomials) so results do not depend on the engine.                                                                |
| Wall clock (`Date`, `performance.now`) | Non-determinism enters through "networking, the system clock, and thread scheduling" [12].                                                                                                                                                                                                                                                  | Already banned in core; tick counters only.                                                                                                                                                                                                                                                                                       |
| `Map`/`Set` iteration                  | Iteration is insertion order [9], so it is deterministic only if insertion order is. Plain-object key order has more complex rules and MDN advises not to rely on it [9].                                                                                                                                                                   | Keep entities in arrays ordered by a monotonically increasing entity ID; when a `Map` is used, insert in tick-ordered code paths only. Never iterate objects keyed by content IDs to drive simulation order unless the order is fixed at load time.                                                                               |
| Sorting                                | `Array.prototype.sort` is stable since ES2019 [8], but a comparator that violates the five well-formedness rules yields results that are "different across engines" (MDN shows V8/JSC and SpiderMonkey disagreeing) [8].                                                                                                                    | Comparators must be pure, reflexive, anti-symmetric and transitive; break ties by entity ID.                                                                                                                                                                                                                                      |
| Update order                           | With sequential updates "the order in which the objects are updated is significant"; removing during iteration can skip objects; defer removals [17].                                                                                                                                                                                       | Fixed system order in `Simulation.step()`; process events and deaths in deterministic order; defer spawns/removals to the end of the tick.                                                                                                                                                                                        |
| Float accumulation vs integers         | 0 A.D. bans floats from serialized state for cross-platform sync [61].                                                                                                                                                                                                                                                                      | Not needed for single-player, same-machine replays; floats plus the rules above suffice. Consider integers/fixed-point only if networked lockstep is ever added.                                                                                                                                                                  |

### What this means for Eternalus

- Keep `GameLoop` as in the architecture doc; clamp the accumulator (the planned `5 * TICK_MS`
  is in the same spirit as Fiedler's 0.25 s cap and his 4-frames-per-render limit) [1][3][12].
- Rendering interpolation needs two positions per entity (previous and current tick). Store them
  in the snapshot the views read, never in the entity (the Position component of 0 A.D. keeps the
  previous-turn position for exactly this purpose) [61].
- Add `Simulation.checksum()` (hash of tick number, RNG state, and per-entity id/position/hp)
  and a test that runs the same seed + command log twice and compares checksums every N ticks;
  this is the desync detector every lockstep engine relies on [3][61].
- Write a lint rule (or a test) that forbids `Math.random`, `Date`, `performance`, `Map`
  iteration in hot paths without an ordering comment, and direct `Math.sin/cos/atan2` in
  `packages/core` outside `utils/math`.

## 2. OOP entity hierarchies vs ECS vs hybrid

### Findings

Three architectures appear in the literature:

1. Deep class hierarchies. West describes their failure mode ("the blob"): functionality added
   near the root burdens every leaf; functionality added in leaves gets duplicated; refactoring
   the tree is constant [13]. Nystrom's Update Method chapter agrees the industry moved away from
   subclassing `Entity` for every behaviour, but also says "the pendulum has swung a bit too far
   away from subclassing... being dogmatic about not using inheritance is as bad as being
   dogmatic about using it" [17]. Subclass Sandbox recommends "a shallow but wide class
   hierarchy", with the base class providing the operations subclasses compose, because "wide
   inheritance trees [are] easier to work with than deep ones" [16].
2. Entity-Component (EC): an entity owns component objects that carry data and behaviour; the
   entity is "a thin shell that binds the components together"; components communicate by
   modifying the container's shared state, by direct references between the few pairs that need
   it, or by messages [11]. West reached this by turning the Tony Hawk blob into components and
   then into data-driven object creation, and notes that going through a component manager for
   every cross-component call cost over 5% CPU, so they allowed direct pointers [13]. 0 A.D.'s
   simulation is built this way: an entity is only an ID plus components; components talk by
   `QueryInterface` or by posted/broadcast messages; interfaces (e.g. `Position`) have several
   implementations (`PositionInterpolated`, `PositionStatic`) chosen per entity [61]. OpenRA's
   actors are collections of traits, each split into a `TraitInfo` (properties set from MiniYaml)
   and a `Trait` implementation that holds state and behaviour [63]. Excalibur's `Actor` is an
   entity that comes "pre-installed"
   with components; its ECS explicitly does not target cache optimisation [65].
3. Data-oriented ECS: entities are IDs, components are plain data without behaviour, systems are
   functions over component sets; components are stored in contiguous arrays (archetypes, sparse
   sets) for cache locality and easy multithreading [14]. Nystrom's Data Locality chapter reports
   a 50x speed-up from turning pointer-chasing updates into walks over contiguous component
   arrays, but stresses "profile first" and that abstraction (interfaces, virtual calls) is what
   you trade away [27]. The ECS FAQ is explicit that EC frameworks (Unity `GameObject`, "components
   are classes that contain both data and behavior") are not ECS, and that spatial structures
   such as quadtrees are usually not stored inside the ECS at all; a query fills them each
   frame instead [14].

Nystrom's patterns map cleanly onto the requirement for "an Entity hierarchy with composition":

| Pattern                          | Intent (Nystrom)                                                             | Where it belongs in Eternalus                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component [11]                   | Entity spans domains without coupling them                                   | `HealthComponent`, `MovementComponent`, `CombatComponent`, `AbilitiesComponent`, `TargetingComponent` on `Unit`; `HealthComponent` + `TurretComponent` on structures |
| Type Object [15]                 | Kinds defined by data objects, not subclasses                                | `LegendDefinition`, `MobDefinition`, `StructureDefinition` in `core/content/`, referenced by ID                                                                      |
| Prototype (data delegation) [28] | JSON records with a `"prototype"` field inherit fields                       | `extends: 'melee-minion'` for `super-melee-minion`; boss variants of camp mobs                                                                                       |
| Subclass Sandbox [16]            | Base class provides safe primitives, subclasses implement one sandbox method | `Ability` base with `dealDamage()`, `applyStatus()`, `spawnProjectile()`; each ability overrides `activate()`                                                        |
| Command [19]                     | Reified request; same stream from input and AI                               | `Command` union (already planned); bots emit the same commands as the player                                                                                         |
| Observer / Event Queue [20][18]  | Decouple who reacts to an event; queue decouples when                        | `GameEvents` (synchronous observer inside core); a ring-buffered queue for cross-tick events such as `entity-died` rewards                                           |
| State [21]                       | Behaviour changes with internal state; HFSM/pushdown for reuse               | Unit FSM (`idle/marching/chasing/attacking/returning/dead`), gate `open/closed`, match phases                                                                        |
| Update Method [17]               | Each object/system simulates one tick                                        | Systems (`MovementSystem.update`) not entities own the loop; entities' components are updated in fixed system order                                                  |
| Service Locator [22]             | Global access to a service through an interface                              | Use sparingly; prefer constructor injection (0 A.D. also says "avoid global state... singletons") [62]                                                               |
| Flyweight [23]                   | Share intrinsic state                                                        | Terrain tile types, sprite frames, immutable definitions                                                                                                             |
| Dirty Flag [24]                  | Defer derived-data recomputation until needed                                | Terrain layer and minimap re-render only when destructible terrain changes; flow fields rebuilt only when the cost grid changes                                      |
| Object Pool [25]                 | Reuse fixed sets of objects                                                  | Projectiles, particles, hit events, minion instances                                                                                                                 |
| Spatial Partition [26]           | Locate objects by position                                                   | Uniform grid for units; separate static structure index                                                                                                              |
| Data Locality [27]               | Contiguous arrays in the order they are processed                            | Only for hot arrays (steering neighbours, flow fields) after profiling                                                                                               |

### Recommendation: the Eternalus entity model

Use an EC hybrid: classes for identity and lifecycle, components for state and behaviour,
systems for per-tick loops, definitions for data. The hierarchy stays three levels deep:

```
Entity (id, teamId, position, radius, definitionId, components)
├─ Unit          (adds HealthComponent, MovementComponent, CombatComponent, TargetingComponent)
│  ├─ Legend     (adds AbilitiesComponent, ExperienceComponent; controller: PlayerController | BotController)
│  ├─ Mob        (lane minions; MovementStrategy = LaneFlowFieldFollow)
│  └─ NeutralEntity (camp mobs and bosses; MovementStrategy = LeashedChase, spawns via camp timer)
└─ Structure     (static; adds HealthComponent; optional TurretComponent, GateComponent, BlocksPathing)
   ├─ Tower / Turret / Wall / Gate / Nexus (thin subclasses or, better, one Structure with definition flags)
```

Rules of thumb drawn from the sources:

- Subclasses exist only where an instance genuinely needs different lifecycle code (a Legend
  levels up and respawns; a Mob despawns; a Structure never moves). Everything tunable or
  swappable is a definition field or a strategy object, per Type Object ("hundreds of breeds"
  without hundreds of subclasses) [15].
- Behaviour that varies per kind is a Strategy interface chosen from data
  (`movement: 'lane-flow'`, `targeting: 'minion-aggro'`), which is Nystrom's suggested way to
  give type objects behaviour ("a fixed set of pre-defined behaviors and then use data in the type
  object to simply select one of them") [15].
- Systems iterate arrays of components (`MovementSystem` walks all `MovementComponent`s), not
  entities calling `update()` on themselves; this keeps ordering explicit and lets you later move
  a hot component into a struct-of-arrays layout without touching the entity classes [27][17].
- Components talk through the entity's shared state (position, team) or through `GameEvents`,
  never by importing another system; West's warning that a manager-mediated call per access was
  too slow argues for holding direct references to sibling components when a pair is tightly
  coupled (Combat needs Targeting) [13][11].
- Keep the door open to ECS storage for one or two hot components, but do not adopt an ECS
  framework: the team cannot use libraries, cache-friendly ECS is not needed at 300 entities, and
  the grading rubric wants visible OOP structure.

## 3. Pathfinding and movement for lane minions and large unit counts

### Findings

Flow fields. Patel's Red Blob article explains the core idea: a tower-defence-style game has
many sources and one destination, so instead of running A* per enemy you run breadth-first
search (or Dijkstra with weights) once from the goal, store `came_from`/distance per cell, and
every unit simply follows the arrows; new or jostled units need no replanning, and the vector
field is the negative gradient of the distance field [30]. Emerson's Supreme Commander 2 chapter
(the GDC talk in written form) is the production reference: the world is split into 10x10
sectors joined by portals; each sector has a cost field (8-bit, 255 = wall), an integration field
(cost to goal) and a flow field (4-bit direction + flags); a path request runs A* across the
portal graph, then requests flow-field tiles along that path; tiles are cached and shared between
requests; a line-of-sight pass lets agents near the goal steer directly; dynamic changes (walls,
buildings) mark sectors dirty and rebuild "based on a priority queue, where each item in the queue
is given a time slice of a fixed number of milliseconds"; CPU is bounded by "capping the number
of tiles or grid squares you commit to per tick"; agents blend new flow directions as they cross
cells, and physics handles pushing and sliding along walls [32]. The howtorts tutorial shows the
minimal JS version: a Dijkstra flood fill produces distances, each cell points at its lowest
neighbour, and agents bilinearly interpolate the four surrounding vectors before converting the
desired velocity to a steering force [33].

A* and friends. Patel's A* introduction: BFS for uniform costs, Dijkstra for weighted edges,
greedy best-first for speed without optimality, A* combines both and is optimal when the
heuristic never overestimates; use BFS/Dijkstra when you need paths to or from all locations,
A* when you need one path; "the best thing to do is to eliminate unnecessary locations in your
graph" [31].

Steering. Reynolds' GDC 1999 paper defines the simple vehicle model (mass, position, velocity,
max force, max speed; `steering = truncate(desired - velocity, max_force)`), and the behaviours:
seek (`desired = normalize(target - position) * max_speed`), arrival (ramp speed down inside a
slowing radius), obstacle avoidance (keep a cylinder of free space ahead), path following (stay
within a radius of a spine), flow-field following, and the group behaviours separation
(1/r-weighted repulsion from neighbours within a radius and angle), cohesion and alignment;
behaviours are combined by weighted sums, priorities, or "prioritized dithering" [34]. He notes
separation's neighbour search "might use some sort of spatial partitioning or caching scheme to
limit the search to local characters" [34].

Local avoidance. ORCA (van den Berg, Guy, Snape, Lin, Manocha) gives sufficient conditions for
collision-free motion where each agent takes half the responsibility for avoiding a pairwise
collision, reduces the choice to a low-dimensional linear program, and demonstrates thousands of
agents in a few milliseconds; the RVO2 library is its reference implementation [35]. Reynolds'
"unaligned collision avoidance" is the lighter predecessor: predict nearest approach and steer
laterally/accelerate to miss it [34].

### What this means for Eternalus (a pipeline for ~300 units)

1. Grid and cost field. Rasterise the map into a walkability/cost grid (`Uint8Array`, 255 =
   blocked) at a resolution where the smallest unit fits in a cell; walls, gates (closed) and
   structures stamp their footprints (Emerson's "cost stamps") [32]. Because
   `NUM_LANES`/`NUM_*_TOWERS` regenerate the map, the grid must be derived from the map model at
   load, never hand-authored.
2. Lane flow fields. For each (lane, team) run a Dijkstra flood fill from that team's goal
   (enemy base) restricted to a corridor mask around the lane spline, producing an integration
   field (`Uint16Array`) and a direction field (`Int8Array` dx/dy pairs) [30][33]. Mobs follow
   the field; the lane spline only shapes the corridor and spawn/waypoint positions. This handles
   destructible walls automatically: when terrain changes, mark the affected lane fields dirty
   and rebuild them over several ticks with a per-tick cell budget, exactly as Emerson describes
   [32]. Budget estimate (ours, not from a source): a 256x144 grid is ~37k cells; a full flood
   fill of that size is tens of thousands of array operations, affordable once per change even
   without time slicing.
3. Legends and camps. Bots and player click-to-move use A* on the same grid with an octile
   heuristic and string-pulling, because they are ~20 units with distinct goals [31]. Neutral
   camp mobs use seek/arrival within a leash radius and return home when the leash breaks [34].
4. Steering. Per unit per tick: desired velocity = interpolated flow vector x max speed (or
   seek/arrival for chases), plus separation from neighbours found through the spatial hash
   (section 4), truncated to max force and max speed [33][34]. Use Reynolds' priority scheme:
   obstacle/wall avoidance first, then separation, then the flow field, so units never accept a
   steering force that pushes them into a wall [34].
5. Local avoidance. Separation plus circle push-out (section 4) is enough for lane blobs. Do
   not implement ORCA unless playtests show shuffling; if you do, treat it as an alternative
   `AvoidanceStrategy` so the interface does not change [35].
6. Determinism. Iterate units in ID order, keep neighbour lists ordered by ID, and avoid
   `Math.atan2` in steering (work with vectors, never angles) so the steering system is replay
   safe (section 1).

## 4. Spatial partitioning and collision

### Findings

Nystrom's Spatial Partition chapter frames the problem: naive pairwise checks are O(n^2); a
fixed grid ("a persistent bucket sort") stores each unit in the cell containing its position and
checks only the same and neighbouring cells; when range matters you must scan neighbours and can
scan only half of them to avoid double counting; flat grids are simpler, constant in memory and
fast to update, hierarchical structures (quadtrees) handle very uneven densities; keep a second
plain list of all objects for full traversals [26]. Muller's spatial-hashing tutorial gives the
concrete, allocation-free layout used in particle simulations: choose spacing `h = 2r` so only
the 9 surrounding cells (27 in 3D) must be checked; store particles in a dense array indexed by a
prefix-sum table of cell counts; for unbounded worlds hash `(xi, yi)` with large primes into a
table of roughly `numParticles` entries and accept collisions [36].

Narrow phase. MDN's overview covers AABB overlap, circle-circle (distance between centres less
than the sum of radii), points to SAT for convex polygons, and recommends a broad phase (grid,
quadtree, R-tree, spatial hashmap) before the narrow phase [37]. Bittle's SAT article: project
both convex shapes onto each candidate axis (the perpendicular of every edge; parallel axes can
be skipped, so a rectangle has two), any non-overlapping projection proves separation, the axis
with the smallest overlap gives the minimum translation vector, circle-vs-circle is a one-axis
SAT along the centre line, and circle-vs-polygon needs an extra axis from the polygon's closest
vertex to the circle centre [38].

Continuous collision. Box2D's manual explains tunnelling ("rigid bodies can move by a large
amount in one time step... objects incorrectly pass through each other"), that Box2D by default
sweeps dynamic bodies against static bodies and moves them to the time of impact, that fast
bodies can be flagged as bullets to get CCD against everything except other bullets, and that
sensors do not detect objects that pass through within one step, so "if you have fast moving
object and/or small sensors then you should use a ray or shape cast to detect these events" [39].
Fiedler lists tunnelling among the consequences of unbounded time steps [1].

Fixed point vs float. 0 A.D. keeps floats out of synchronised simulation state for cross-machine
determinism [61]; Fiedler's survey shows floats are reproducible on one machine and that RTS
studios shipped float-based lockstep by controlling FPU modes [2]. In JavaScript all engines use
IEEE doubles for arithmetic, so the only non-portable pieces are the transcendental functions
[6]; integer-only maths is a stricter option that also removes them but costs readability.

### What this means for Eternalus

- Broad phase: one uniform grid over the map with cell size = largest unit diameter (Muller's
  `h = 2r` rule) rebuilt every tick from the entity arrays into pre-allocated `Int32Array`s
  (counts, prefix sums, entries) [36]. Rebuilding is cheaper and simpler than maintaining
  linked cells for 300 moving units, and it keeps the structure outside the entities (the ECS FAQ
  also recommends building spatial structures from a query each frame rather than storing them in
  components) [14]. Keep a separate static index for structures and wall segments that changes
  only when terrain is destroyed [26].
- Narrow phase: circle-circle for unit-unit (push-out along the centre line, resolving pairs in
  ID order for determinism), circle-vs-AABB or circle-vs-convex-polygon via SAT for structures
  and walls, with the MTV used to slide along walls as SupCom2 does [38][32].
- The product owner's runtime check: for every entity that moved this tick, cast the segment
  from its previous position to its new position against the unbreakable static index (walls,
  map bounds, gates when closed). If it intersects, resolve to the time of impact and emit a
  `GameEvents` `collision-anomaly` event carrying entity id, tick, from/to and collider id; a
  debug listener logs it and tests assert it never fires. This is Box2D's shape-cast advice
  applied as an assertion rather than a physics feature [39]. Projectiles and dashes must always
  use the swept test, not only the overlap test.
- Stay on doubles. Adopt the transcendental-function wrapper from section 1 rather than
  fixed-point; revisit only if the game ever becomes networked lockstep [2][61].

## 5. Canvas 2D performance

### Findings

MDN's canvas optimisation guide recommends: pre-render repeated drawing to an offscreen canvas;
round coordinates passed to `drawImage` to integers because sub-pixel positions force
anti-aliasing work; cache pre-scaled sprites instead of scaling in `drawImage`; split the scene
across layered `<canvas>` elements (UI on top changing only on input, gameplay in the middle
every frame, static background underneath); use CSS for large static backgrounds; scale with CSS
transforms (GPU) rather than drawing bigger canvases; set `getContext('2d', { alpha: false })`
when the backdrop is opaque; size the backing store by `devicePixelRatio` and `ctx.scale(dpr,
dpr)` for crisp output; batch calls, avoid state changes, render only differences, avoid
`shadowBlur` and text, and use `requestAnimationFrame` [40]. Smus's web.dev article adds data
from JSPerf runs: pre-rendering pays off when the temporary canvas fits the image snugly (a
loose, oversized one loses the gain), grouping draws by fill style beats interleaving state
changes, redraw regions ("keep track of the drawn bounding box, and only clear that") beat
full clears, layered canvases let the compositor blend layers and let you "render the background
only every Nth frame", `shadowBlur` is very expensive, integer coordinates avoid anti-aliasing
(with the `(0.5 + n) | 0` trick), and `requestAnimationFrame` yields to the browser and pauses
when the page is hidden [41]. MDN's tilemap guide covers the map side: keep tiles in one atlas so
each tile is a `drawImage` sub-rectangle; separate the visual grid from the logic grid (collision,
pathfinding); "only tiles that are visible should be rendered"; pre-render the visible section
off-canvas with one tile of bleed so it is redrawn only when the camera moves a whole tile; or
split the map into large chunks pre-rendered as "big tiles" [43]. `OffscreenCanvas` decouples
canvas from the DOM, is transferable, can be drawn in a worker with its own
`requestAnimationFrame`, and can hand frames to a visible canvas through `transferToImageBitmap`
and a `bitmaprenderer` context [42]. MDN's `requestAnimationFrame` page also warns that
animations must use the callback timestamp or they run faster on high-refresh screens [44].

### What this means for Eternalus

- Layers (all owned by `Renderer`): (1) a terrain canvas, `alpha:false`, holding pre-rendered
  map chunks (say 512x512 device pixels each) built from the map model; chunks are redrawn only
  when a destructible tile changes (dirty flag per chunk) [40][43][24]; (2) an entity canvas
  cleared and redrawn every frame with sprites sorted by y (and grouped by atlas to limit state
  changes); (3) a lightweight overlay canvas for selection rings, range indicators and debug
  draws; the HUD stays in React/DOM as planned. Three canvases with `position:absolute` and
  z-index, exactly as MDN's example [40].
- Camera and culling: convert world to screen once per frame (`worldToScreen`), draw only chunks
  and entities inside the viewport plus a margin; query the entity spatial grid for the visible
  rectangle instead of scanning all entities [43][26].
- Sprites: one atlas per team/faction, frames pre-scaled to the device pixel ratio at load time
  so `drawImage` never scales; integer destination coordinates; interpolate positions in world
  space and round only at draw time [40][41].
- Minimap: a separate small canvas drawn by a `MinimapView` that reads the same snapshot and
  applies a world-to-minimap scale (a scaled render of the same scene, not a separate scene
  graph). Its terrain comes from downscaling the terrain chunks once (and again when a chunk is
  dirty); unit dots are redrawn at a lower cadence (every 3rd or 6th frame), following Smus's
  "render the background only every Nth frame" advice [41][40].
- DPR: size the backing stores by `devicePixelRatio` and scale the context; keep all game
  coordinates in CSS pixels [40].
- Use `requestAnimationFrame` only; the accumulator handles pauses [44][41].
- OffscreenCanvas is a later optimisation (worker-side rendering or chunk baking); it is not
  required to hit 60 fps with a few hundred sprites [42].

## 6. Object pooling and GC avoidance

### Findings

V8's collector is generational: allocations go to a nursery, survivors of a scavenge are
promoted, and "short-lived objects are actually very cheap from the garbage collector's
perspective, as we only pay for objects that survive the collection"; major GC still has a
main-thread pause after concurrent marking, and Chrome schedules idle-time GC in the spare part
of a 16.6 ms frame [45]. Nystrom: object pools matter less in GC languages "but pools are still
useful there to avoid the cost of allocation and deallocation", with the caveat that pooled
objects must clear references so they do not keep other garbage alive; pools should be sized so
important objects never fail to allocate, while particles may simply be skipped [25]. His Event
Queue uses a fixed ring buffer ("no dynamic allocation... cache-friendly contiguous memory") [18],
and Data Locality shows why struct-of-arrays and contiguous component arrays are faster [27].
The ECS FAQ defines AoS vs SoA and notes SoA avoids loading unused fields into cache, while random
access across fields costs more [14]. bitECS demonstrates SoA in TypeScript with `Float32Array`
columns per component field indexed by entity ID [46]. Lewis (web.dev) recommends keeping
per-frame JavaScript to a few milliseconds, moving pure computation to workers when possible, and
avoiding micro-optimisation except in games, "as you'll be typically fitting a lot of computation
into a single frame, and in that case everything helps" [47]. Muller's spatial hash and the flow
fields of section 3 are all typed-array structures with zero per-frame allocation [36][32].

### What this means for Eternalus

- Pool: projectiles, particles, floating damage numbers, `GameEvents` payloads for high-frequency
  events, and minions (reuse a `Mob` instance when a wave despawns). Always reset every field on
  acquire and null out references on release [25].
- Pre-allocate: flow fields, integration fields, the spatial hash tables, per-tick neighbour
  lists, and the snapshot buffers shared with the renderer. Reuse scratch vectors in steering
  code instead of returning new `{x, y}` objects from vector helpers in hot loops [36][27].
- Prefer arrays indexed by entity slot over `Map<id, Entity>` in systems; keep a free-list of
  slots (Nystrom's free list) so IDs are stable and iteration order is deterministic [25].
- Consider SoA only for `MovementComponent` data if profiling shows steering dominating; the
  component class can wrap views into typed arrays without changing its interface [27][46].
- Measure with the Performance panel before optimising; the sources agree on "profile first"
  [27][47].

## 7. Game AI for bots

### Findings

Behaviour selection. Game AI Pro's overview: FSMs are "the most common behavioral modeling
algorithm used in game AI programming today"; HFSMs add history states so behaviours like "conversation" are not
duplicated; behaviour trees start at the root each evaluation, are largely stateless, keep
behaviours unaware of each other so adding/removing one does not affect the rest, but re-running
from the root costs more than an FSM and stateless trees can oscillate; utility systems score
actions on continuous inputs and pick the best or weighted-random option, suit RPG/RTS economic
decisions and many-option cases, but are harder to tune; GOAP (Orkin, F.E.A.R.) plans backwards
from goals with preconditions and effects and removes authorial control; HTN plans forwards by
decomposing tasks [48]. The Behavior Tree Starter Kit gives the reference implementation:
behaviours with `onInitialize/update/onTerminate` returning `SUCCESS/FAILURE/RUNNING`,
sequences (AND), selectors (OR), decorators, parallels, monitors and active selectors that
re-check higher-priority branches; "it is often not necessary to update the behavior tree every
game frame, with many games deciding to update each behavior tree every other frame or at 5Hz so
that the load for updating the behavior trees of all characters can be spread across multiple
game frames"; second-generation trees share node data between instances and use event-driven
scheduling [49]. Orkin's GOAP page lists shipped GOAP games, including Demigod (Gas Powered
Games/Stardock, 2009) [50], the same studio whose float-determinism practice for DemiGod and
Supreme Commander Fiedler quotes [2]. 0 A.D. gives the same performance advice for component
scripts: "run on a timer rather than on every simulation turn" [61].

MOBA reference rules. League of Legends minions path linearly along the lane until they find a
valid enemy, then move to and attack it; targets must be within 500 units; a "call for help"
aggro triggers when a champion stands in the minion's path with no other targets and outside a
turret's range, or when a champion basic-attacks (or uses most unit-targeted abilities on) an
enemy champion, prioritising the closest champion; the priority list is (1) enemy champions
attacking an allied champion, (2) enemy minions attacking an allied champion, (3) enemy minions
attacking an allied minion, (4) enemy turrets attacking an allied minion, (5) closest enemy
minion, (6) closest enemy champion; a minion switches only to a strictly higher-priority target
and re-evaluates between attack windups; the first wave is "ghosted" for 18-28 s so neither side
gains a push advantage without champions [51]. League turrets attack the first unit in range,
keep it until it dies or leaves, then choose by priority (pets, siege/super minions, melee
minions, caster minions, then champions), and immediately switch to an enemy champion who
damages an allied champion within 1400 range [52]. Dota 2 lane creeps search a 500 radius, chase
an aggroed target "for a few seconds" (patch history: aggro duration 2.3 s, cooldown 3 s), draw
aggro from an attack command on an enemy hero even before the attack lands, and siege creeps
prefer siege creeps and buildings [53].

### What this means for Eternalus

- Minions and structures: FSM per unit (`marching -> engaging -> returning`), with the target
  choice implemented as a data-driven priority list plus acquisition radius, leash time and
  aggro cooldown copied from the published rules above [48][51][53]. Store the numbers in
  `content/` (`acquisitionRange`, `leashTicks`, `aggroCooldownTicks`, `priorityOrder`).
  Turrets: first-in-range stickiness, priority list, and "defend the ally" override [52].
- Legend bots: a behaviour tree per role (`laner`, `jungler`, `support`) built from a small
  node library (sequence, selector, active selector, condition, action, cooldown decorator),
  with leaf conditions reading only simulation state and leaf actions emitting `Command`s (the
  Command pattern already decouples AI from actors) [49][19]. Use a utility scorer inside the
  tree for target selection and ability choice (distance, target HP, threat, cooldown) [48].
- Cadence: tick each Legend's tree every 6th tick (5 Hz) with a stagger (`entityId % 6`) so 20
  trees cost roughly 3 evaluations per tick; minion FSMs re-evaluate targets only between attack
  windups, as League does [49][51]. Never read wall time; all timers are tick counts.
- Determinism: bots consume the same snapshot, in ID order, and any randomness (weighted-random
  utility picks) comes from the seeded core RNG [48][5].
- Skip GOAP/HTN. They shine when action sets are open-ended; MOBA bots have a fixed, small
  action vocabulary and designers want predictable behaviour [48].

## 8. Web Workers for the simulation

### Findings

`postMessage` structured-clones its payload; serialisation blocks the sender and deserialisation
blocks the receiver; Surma's benchmarks show transfer time proportional to the JSON size of the
object, with everything up to 10 KiB posing no risk to a 16 ms animation budget and 100 KiB
fine for a 100 ms interaction budget even on slow phones; strategies for bigger state are patch
sets, chunking, and binary formats in `ArrayBuffer`s, whose transfer "is extremely fast and
independent of the size of the ArrayBuffer" because ownership moves instead of copying [54]. MDN
confirms transferables are zero-copy moves that detach the original buffer, that typed arrays are
serialisable but only their `.buffer` is transferable, and lists `OffscreenCanvas` and
`ImageBitmap` among transferables [55]. `SharedArrayBuffer` lets threads share one memory block
(with `Atomics` for synchronisation) but the document must be a secure context and cross-origin
isolated via COOP/COEP headers; without them `postMessage` throws for shared buffers and the
constructor is hidden [56]. `OffscreenCanvas` allows rendering in a worker and using
`requestAnimationFrame` there [42]. Lewis recommends moving pure computation off the main thread
when it does not need the DOM [47].

### What this means for Eternalus

- Milestone 1: run the simulation on the main thread. At 30 ticks/s with ~300 entities and no
  physics library, the budget question is whether a tick stays well under 33 ms (Fiedler's
  headroom rule), and a single-threaded design is far easier to test and debug [1].
- Keep the worker option open by design: `Simulation` already has no DOM access; snapshots
  should be plain data or, better, typed-array buffers so they can be transferred rather than
  cloned; commands are tiny objects and can be cloned cheaply [54][55].
- If profiling later shows the tick starving rendering, move `Simulation` to a dedicated worker,
  send commands in, receive one snapshot per tick as a transferred `ArrayBuffer` (positions,
  previous positions, HP, state flags), and keep rendering on the main thread. Only if
  snapshot sizes exceed the ~10 KiB rule of thumb should you consider `SharedArrayBuffer`, which
  brings header configuration and `Atomics` complexity [54][56].
- Tests should be able to run the same simulation in Node (no worker), which the layering rules
  already guarantee.

## 9. Config-driven and data-driven design

### Findings

Type Object shows how to lift kinds into data, including JSON with a `"parent"` field and
copy-down inheritance resolved at load time so lookups stay fast, at the cost of tracking type
objects manually and making per-kind behaviour harder (solved by selecting from a fixed set of
behaviours) [15]. Nystrom's Prototype chapter argues the same for data files: a `"prototype"`
field that delegates missing properties removes duplication across `goblin grunt/wizard/archer`
and is "a particularly good fit for data in games where you often have one-off special entities"
such as bosses [28]. Real engines do exactly this: OpenRA defines actors in MiniYaml with an
`Inherits` mechanism and maps YAML nodes onto `TraitInfo` fields through a `FieldLoader` [63];
0 A.D. builds entities from XML templates whose elements name components and carry their init
data, supports script hot-loading while the game runs, and centralises tuning in data [61].

Validation options. TypeScript 4.9's `satisfies` checks that a literal matches a type "without
changing the resulting type of that expression", so a content table can be checked against
`Record<UnitId, UnitDefinition>` while keeping literal key types for autocomplete and exhaustive
lookups [58]. Zod is a TypeScript-first schema validator with static type inference, zero
external dependencies and a 2 kb core, but it is a dependency [59]. Ajv compiles JSON Schema (or
JSON Type Definition) into fast validation functions; compilation is slow so schemas must be
compiled once and reused [60]. Vite's HMR API (`import.meta.hot.accept`, `hot.dispose`,
`hot.data`) lets a module accept updates to itself or specific dependencies without reloading the
page; calls must be guarded by `if (import.meta.hot)` and appear literally as
`import.meta.hot.accept(` [57].

### What this means for Eternalus

- Keep content as TypeScript modules (`core/content/*.ts`) exported as `const` tables with
  `satisfies Record<'melee-minion' | ..., MobDefinition>`; this gives compile-time validation
  with zero dependencies and preserves literal IDs [58]. Add a hand-written runtime validator
  (`validateContent()`) that checks cross-references (every `abilityId` exists, every lane index
  is below `NUM_LANES`) and numeric ranges; run it in a test and at startup in development.
  Zod/Ajv become worth it only if content moves to JSON authored by non-programmers [59][60].
- Map generation must be a pure function of `MapConfig` (`NUM_LANES`, `NUM_SPAWN_TOWERS`,
  `NUM_BUFF_TOWERS`, map size, seed): it produces lanes as splines, tower positions along each
  lane, walls/gates, camps, the cost grid and the pre-baked lane flow fields. Tests can then
  assert, for example, that `NUM_LANES = 5` yields five distinct flow fields and
  `5 * NUM_SPAWN_TOWERS` spawn towers.
- Implement single-parent data inheritance (`extends`) with copy-down resolution at load so the
  runtime never walks a chain [15][28].
- Hot reload: wrap the content module in `import.meta.hot.accept` (client side only) and on
  update re-resolve definitions and re-point existing entities at the new definition objects; this
  reproduces 0 A.D.'s "data unchanged, code/values reloaded" experience for tuning sessions
  [57][61]. Definitions must be immutable so a swap cannot corrupt running state.

## 10. Reference architectures

| Project                                                | What is worth borrowing                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Source    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 0 A.D. / Pyrogenesis (C++ engine, JavaScript gameplay) | Entity = ID + components; interfaces with alternative implementations (`PositionInterpolated` vs `PositionStatic`); one-to-one calls via `QueryInterface`, one-to-many via posted/broadcast messages; components must serialize, checksum and dump their state; no floats or platform-sized ints in synced state; entities built from XML templates; scripts hot-load; "run on a timer rather than on every simulation turn" for expensive components; avoid global state and singletons | [61][62]  |
| OpenRA (C#)                                            | Actors are collections of traits; each trait splits into a `TraitInfo` (properties loaded from MiniYaml by a `FieldLoader`) and a `Trait` implementation (state and behaviour); `Inherits` for data reuse; the whole game is defined in data files ("mods"); a complete trait reference exists for modders                                                                                                                                                                               | [63][64]  |
| Excalibur.js (TypeScript)                              | `World` with `EntityManager`, `QueryManager`, `SystemManager` updating systems "in priority order"; `Actor` is an entity pre-installed with components; a deliberate choice not to chase cache optimisation                                                                                                                                                                                                                                                                              | [65]      |
| Phaser (JavaScript)                                    | Scenes own their systems (display list, cameras, input, tweens) while the `Game` owns only global services (renderer, animation manager, texture cache, `TimeStep` loop); a dedicated UI scene rendered above the gameplay scene; explicit `preupdate/update/postupdate/render` events per step                                                                                                                                                                                          | [66]      |
| Supreme Commander 2 (Game AI Pro chapter)              | Flow-field tiles, portal graph A*, dirty-and-rebuild with time slicing, cost stamps for buildings, LOS pass near goals                                                                                                                                                                                                                                                                                                                                                                   | [32]      |
| Game Programming Patterns (book)                       | The pattern vocabulary in section 2                                                                                                                                                                                                                                                                                                                                                                                                                                                      | [11]-[29] |

Open-source browser MOBA/RTS clones with documented architecture were not found in this pass;
the RTS references above (0 A.D., OpenRA) are C++/C#, and the two JS engines are useful for
structure only (the team cannot depend on them).

### What this means for Eternalus

Adopt the 0 A.D./OpenRA split explicitly: `Definition` objects (shared, immutable, from
`content/`) versus entity components (per instance, serialisable). Copy 0 A.D.'s rule that every
component can be serialised and checksummed; it gives replays, save games and desync tests for
free [61]. Copy Phaser's separation of global services (renderer, asset cache, loop) from
per-match state so a rematch tears down and rebuilds only the match [66]. Copy Excalibur's
system ordering by explicit priority so `Simulation.step()` reads as a list [65].

## Works cited

All accessed 2026-09-30.

1. Glenn Fiedler, "Fix Your Timestep!", Gaffer On Games (Game Physics series; page undated, the series is dated 2004 on the category index [4]). https://gafferongames.com/post/fix_your_timestep/
2. Glenn Fiedler, "Floating Point Determinism", Gaffer On Games (undated). https://gafferongames.com/post/floating_point_determinism/
3. Glenn Fiedler, "Deterministic Lockstep", Gaffer On Games (undated). https://gafferongames.com/post/deterministic_lockstep/
4. Gaffer On Games, "Game Physics" category index (lists "Networked Physics (2004)"). https://gafferongames.com/categories/game-physics/
5. MDN, "Math.random()" (last modified Jul 10, 2025). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
6. MDN, "Math" (last modified Jul 10, 2025). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math
7. Yang Guo, "There's Math.random(), and then there's Math.random()", V8 blog, 17 Dec 2015. https://v8.dev/blog/math-random
8. MDN, "Array.prototype.sort()" (last modified Jul 20, 2025). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
9. MDN, "Map" (last modified Aug 13, 2026). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
10. bryc, "Pseudorandom number generators" (PRNGs.md), GitHub (undated, public domain). https://github.com/bryc/code/blob/master/jshash/PRNGs.md
11. Robert Nystrom, "Component", Game Programming Patterns (site (c) 2009-2021). https://gameprogrammingpatterns.com/component.html
12. Robert Nystrom, "Game Loop", Game Programming Patterns. https://gameprogrammingpatterns.com/game-loop.html
13. Mick West, "Evolve Your Hierarchy", Cowboy Programming, 5 Jan 2007. https://cowboyprogramming.com/2007/01/05/evolve-your-heirachy/
14. Sander Mertens, "Entity Component System FAQ", GitHub README (undated). https://raw.githubusercontent.com/SanderMertens/ecs-faq/master/README.md
15. Robert Nystrom, "Type Object", Game Programming Patterns. https://gameprogrammingpatterns.com/type-object.html
16. Robert Nystrom, "Subclass Sandbox", Game Programming Patterns. https://gameprogrammingpatterns.com/subclass-sandbox.html
17. Robert Nystrom, "Update Method", Game Programming Patterns. https://gameprogrammingpatterns.com/update-method.html
18. Robert Nystrom, "Event Queue", Game Programming Patterns. https://gameprogrammingpatterns.com/event-queue.html
19. Robert Nystrom, "Command", Game Programming Patterns. https://gameprogrammingpatterns.com/command.html
20. Robert Nystrom, "Observer", Game Programming Patterns. https://gameprogrammingpatterns.com/observer.html
21. Robert Nystrom, "State", Game Programming Patterns. https://gameprogrammingpatterns.com/state.html
22. Robert Nystrom, "Service Locator", Game Programming Patterns (the served page is an older "work in progress" draft). https://gameprogrammingpatterns.com/service-locator.html
23. Robert Nystrom, "Flyweight", Game Programming Patterns (book source on GitHub; the web page returned empty during this session). https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/flyweight.markdown
24. Robert Nystrom, "Dirty Flag", Game Programming Patterns (book source on GitHub). https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/dirty-flag.markdown
25. Robert Nystrom, "Object Pool", Game Programming Patterns. https://gameprogrammingpatterns.com/object-pool.html
26. Robert Nystrom, "Spatial Partition", Game Programming Patterns (book source on GitHub; the web page returned empty during this session). https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/spatial-partition.markdown
27. Robert Nystrom, "Data Locality", Game Programming Patterns. https://gameprogrammingpatterns.com/data-locality.html
28. Robert Nystrom, "Prototype", Game Programming Patterns (book source on GitHub). https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/prototype.markdown
29. Robert Nystrom, "Table of Contents", Game Programming Patterns. https://gameprogrammingpatterns.com/contents.html
30. Amit Patel, "Flow Field Pathfinding for Tower Defense", Red Blob Games (created 6 Feb 2014, last modified 1 May 2026). https://www.redblobgames.com/pathfinding/tower-defense/
31. Amit Patel, "Introduction to the A* Algorithm", Red Blob Games (created 26 May 2014, last modified 29 Sep 2026). https://www.redblobgames.com/pathfinding/a-star/introduction.html
32. Elijah Emerson, "Crowd Pathfinding and Steering Using Flow Field Tiles", Game AI Pro, chapter 23 (CRC Press, 2013; PDF). http://www.gameaipro.com/GameAIPro/GameAIPro_Chapter23_Crowd_Pathfinding_and_Steering_Using_Flow_Field_Tiles.pdf
33. Dave Leaver, "How to RTS: Basic Flow Fields", howtorts.github.io, 4 Jan 2014. https://howtorts.github.io/2014/01/04/basic-flow-fields.html
34. Craig Reynolds, "Steering Behaviors For Autonomous Characters", GDC 1999 (online HTML edition; the index page is dated 6 Jun 2004 and the citation page 4 May 2003). https://www.red3d.com/cwr/steer/gdc99/ ; index https://www.red3d.com/cwr/steer/ ; citation page https://www.red3d.com/cwr/papers/1999/gdc99steer.html
35. Jur van den Berg, Stephen J. Guy, Jamie Snape, Ming C. Lin, Dinesh Manocha, "Optimal Reciprocal Collision Avoidance (ORCA)", UNC Chapel Hill (undated page; publications 2008-2011). https://gamma.cs.unc.edu/ORCA/
36. Matthias Muller, "Blazing Fast Neighbor Search with Spatial Hashing", Ten Minute Physics (PDF, undated). https://matthias-research.github.io/pages/tenMinutePhysics/11-hashing.pdf
37. MDN, "2D collision detection" (last modified May 4, 2026). https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
38. William Bittle, "SAT (Separating Axis Theorem)", dyn4j, 1 Jan 2010. https://dyn4j.org/2010/01/sat/
39. Erin Catto, "Box2D: Simulation" (Box2D 3.1.0 documentation, undated). https://box2d.org/documentation/md_simulation.html
40. MDN, "Optimizing canvas" (last modified Aug 25, 2026). https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
41. Boris Smus, "Improving HTML5 Canvas performance", web.dev (last updated 2011-08-16). https://web.dev/articles/canvas-performance
42. MDN, "OffscreenCanvas" (last modified Oct 26, 2024). https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
43. MDN, "Tiles and tilemaps overview" (last modified Sep 13, 2026). https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps
44. MDN, "Window: requestAnimationFrame() method" (last modified Aug 21, 2026). https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
45. Peter Marshall, "Trash talk: the Orinoco garbage collector", V8 blog, 3 Jan 2019. https://v8.dev/blog/trash-talk
46. NateTheGreatt, "bitECS" README, GitHub (undated). https://raw.githubusercontent.com/NateTheGreatt/bitECS/master/README.md
47. Paul Lewis, "Optimize JavaScript execution", web.dev (last updated 2015-03-20). https://web.dev/articles/optimize-javascript-execution
48. Michael Dawe, Steve Gargolinski, Luke Dicken, Troy Humphreys, Dave Mark, "Behavior Selection Algorithms: An Overview", Game AI Pro, chapter 4 (CRC Press, 2013; PDF). http://www.gameaipro.com/GameAIPro/GameAIPro_Chapter04_Behavior_Selection_Algorithms.pdf
49. Alex J. Champandard and Philip Dunstan, "The Behavior Tree Starter Kit", Game AI Pro, chapter 6 (CRC Press, 2013; PDF). http://www.gameaipro.com/GameAIPro/GameAIPro_Chapter06_The_Behavior_Tree_Starter_Kit.pdf
50. Jeff Orkin, "Goal-Oriented Action Planning (GOAP)", MIT Media Lab page (undated). http://alumni.media.mit.edu/~jorkin/goap.html
51. League of Legends Wiki, "Minion" (community wiki, undated). https://wiki.leagueoflegends.com/en-us/Minion
52. League of Legends Wiki, "Turret" (community wiki, undated). https://wiki.leagueoflegends.com/en-us/Turret
53. Liquipedia, "Lane Creeps" (Dota 2 wiki, undated). https://liquipedia.net/dota2/Lane_Creeps
54. Surma, "Is postMessage slow?", surma.dev, 2019-07-15. https://surma.dev/things/is-postmessage-slow/
55. MDN, "Transferable objects" (last modified Sep 18, 2025). https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
56. MDN, "SharedArrayBuffer" (last modified Feb 10, 2026). https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
57. Vite, "HMR API" (docs for Vite 8.3.1). https://vite.dev/guide/api-hmr
58. TypeScript, "TypeScript 4.9" release notes (page last updated Sep 28, 2026). https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
59. Colin McDonnell, "Zod: Intro" (Zod 4 documentation). https://zod.dev/
60. Ajv, "Getting started" (Ajv v8 documentation, undated). https://ajv.js.org/guide/getting-started.html
61. Wildfire Games, "Simulation System Architecture", 0 A.D. Trac wiki (last modified Apr 13, 2010). https://trac.wildfiregames.com/wiki/SimulationArchitecture
62. Wildfire Games, "Coding Conventions", 0 A.D. Trac wiki (last modified Mar 20, 2018). https://trac.wildfiregames.com/wiki/Coding_Conventions
63. OpenRA, "Glossary", The OpenRA Book (undated). https://www.openra.net/book/glossary.html
64. OpenRA wiki, "Everything you always wanted to know about modding" (edited Jan 5, 2019). https://github.com/OpenRA/OpenRA/wiki/Everything-you-always-wanted-to-know-about-modding
65. Excalibur.js, "ECS" documentation (site (c) 2026). https://excaliburjs.com/docs/entity-component-system/
66. Phaser, "Scenes" (Phaser documentation, (c) 2026). https://docs.phaser.io/phaser/concepts/scenes
