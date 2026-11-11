---
title: Structures, obstacles and destructibles
description: The Structure entity family (strongholds, towers, walls, gates, turrets, camps, the Cathedral), layered shield health, data-driven breakability, spawners, capture points, obstacles and the destructible-terrain pipeline. Read this before adding or changing any building, wall or breakable object.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-11-10
tags: [architecture, structures, obstacles, destructibles, combat]
paths:
  [
    'packages/core/src/entities/structures/**',
    'packages/core/src/entities/Obstacle*',
    'packages/core/src/components/{Health,Spawner,Capturable,Carry}*',
    'packages/core/src/systems/{Structure,Spawn,Capture}System*',
    'packages/core/src/content/{structures,obstacles}/**',
  ]
related:
  [
    'docs/architecture/04-entity-architecture.md',
    'docs/architecture/06-map-and-minimap.md',
    'docs/architecture/10-physics.md',
    'docs/architecture/15-diagnostics-and-runtime-testing.md',
    'docs/reference/game-design/03-structures-and-defenses.md',
  ]
---

# Structures, obstacles and destructibles

**Purpose.** Read this when you implement or change anything that stands still and can be
damaged: a building, a wall, a gate, a turret, a camp, a capture point, a tree or a bridge. It
defines the `Structure` family (D4, D10), the `Health` component with layered shield bars, the
data-driven breakability rules, the spawner and capture mechanics, obstacles, and how destruction
flows into `WorldMap` and the minimap. Every code block is a sketch; the numbers quoted from the
game doc are `TUNE` values that live in `content/`, never in systems.

## 1. The `Structure` family

`Structure` is the abstract child of `Entity` for static things with health. Subclasses exist only
where lifecycle differs; everything tunable comes from a `StructureDefinition` (Type Object) keyed
by kebab-case id, and behaviour that varies per kind is a component or a strategy chosen from data.

```ts
// packages/core/src/entities/structures/Structure.ts (sketch)
export abstract class Structure extends Entity {
  readonly health: Health; // base + layered shield bars
  readonly collider: Collider; // ConvexPolygon footprint, isUnbreakable from BreakabilityRule
  readonly team: Team; // 'light' | 'dark' | 'neutral' (D10)
  protected constructor(
    id: EntityId,
    readonly definition: StructureDefinition,
  ) {
    super(id);
  }
  /** Template Method hook: subclasses register extra components. */
  protected abstract attachComponents(): void;
}
```

| Class          | Extra components                     | Responsibility                                                                             | MVP status                          |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| `Stronghold`   | `Spawner`, `Aura`                    | Capital; its death ends the match; spawns initial hordes and later waves                   | MVP                                 |
| `SpawnerTower` | `Spawner`, `Combat` (self-defence)   | Front line; spawns light hordes every 60 s after the countdown; guards                     | MVP                                 |
| `BuffTower`    | `Spawner`, `Aura`, `Combat`          | Second line; team buffs, enemy debuff aura (10% health/damage, TUNE); shield source        | MVP                                 |
| `WallSegment`  | none                                 | Ring collider; unbreakable until the rule in §3 passes                                     | MVP                                 |
| `Gate`         | `GateState`, `Combat` (fire defence) | Opens for allies/hordes, closes otherwise; burns enemies passing through                   | MVP (fire: MVP-if-time)             |
| `Turret`       | `TurretState`, `Combat`              | Auto-fires bolts; Warrior Legends may take manual control                                  | MVP (manual: MVP-if-time)           |
| `Camp`         | `Spawner`                            | Neutral spawner for forest/corner camps; activates when the match countdown ends (DEC-167) | MVP (corner: MVP-if-time)           |
| `Cathedral`    | `Spawner` (gem), `Aura`              | Middle capture point's building; summons the `GreaterBoss` mid-match                       | MVP (boss summon: per plan phase 3) |

Not a structure: `CapturePoint` is a `Zone` (no collider, §7). Anti-air buildings and form-change
stations (Ascendance/Enchantment) are **post-MVP** (§14).

## 2. `Health` with layered shield bars

The game doc: per living allied buff tower, a spawner tower gains 125% of its base health, another
buff tower 150%, a wall 200%, each as a separate bar that absorbs damage before the base bar (all
`TUNE`, from "How Buff/Debuff Towers ... Buff Walls and Friendly Structures").

```ts
// packages/core/src/components/Health.ts (sketch)
export type ShieldBar = { readonly sourceId: EntityId; current: number; readonly max: number };
/** Where one hit's damage went (DEC-23): shields, base, and what was left once both were empty. */
export type DamageBreakdown = {
  readonly toShields: number;
  readonly toBase: number;
  readonly overflow: number;
};
export class Health {
  base: number; // current base health
  readonly baseMax: number;
  readonly shields: ShieldBar[]; // one per living allied BuffTower, in tower id order
  get total(): number; // base + sum(shields.current)
  /** Drains shields first (newest bar last), then base, and says where the damage went. */
  applyDamage(amount: number): DamageBreakdown;
  addShield(sourceId: EntityId, max: number): void;
  removeShield(sourceId: EntityId): void; // drops the bar; never touches base or other bars
}
```

Worked example (game doc): a structure with 1000 base health, three allied buff towers alive and a
150% bar each has three bars of 1500. Its total is 1000 + 3 × 1500 = **5500**. The game doc's own
example says 4500, which is the sum of the bars alone; flagged in `reference/suggestions/discrepancies.md`
so the product owner can confirm which reading is intended. Damage of 2000 empties one bar and
takes 500 from the next; base stays 1000. When a buff tower dies, `StructureSystem` calls
`removeShield(towerId)` on every allied structure: the bar vanishes with whatever it had left, base
is untouched, so a tower with low base health is never destroyed by another tower's death (the
doc's stated goal). Bar sizes come from `StructureDefinition.shieldFractions[targetKind]` and are
computed on the base max, not compounded (`1.5 × base` per bar). `DamagePipeline` (combat) calls
`applyDamage`; `Health` is the single place that knows the bar order (SRP).

## 3. Breakability as data

Walls and gates are unbreakable until at least two of the defender's three buff towers are down
(game doc). Because `buffTowersPerLane` and `numLanes` are config, the threshold is a fraction:

```ts
// packages/core/src/content/structures/breakability.types.ts (sketch)
export type BreakabilityRule =
  | { readonly kind: 'always' }
  | { readonly kind: 'never' } // corner-camp crystals
  | { readonly kind: 'allied-buff-towers-down'; readonly fraction: number } // TUNE: 2/3
  | { readonly kind: 'all-of'; readonly rules: readonly BreakabilityRule[] };
```

`StructureSystem` evaluates each structure's rule each tick against `GameState`
(`updateBreakability`, through `isBreakableUnder`):
threshold = `ceil(fraction × buffTowersPerTeam)` (2 of 3 today; 4 of 5 with five lanes). The result
sets `Collider.isUnbreakable` and is emitted as `structure-breakability-changed`, so the
`DamagePipeline` rejects damage to unbreakable targets and `CollisionSystem` runs swept tests
against them (`10-physics.md` §7). New rules are new union members plus one evaluator in the
breakability registry, `BREAKABILITY_EVALUATORS` in `content/structures/breakability.ts`, not a
branch in `StructureSystem` (OCP; DEC-168 B7). The evaluators judge a rule on facts the system
gathers once per team per tick (how many of the team's BuffTowers are lost,
`LaneStructures.lostCount`).

**Sentinel sprint-through** (MVP-if-time): a Sentinel at full speed (`Movement.speed >=
maxSpeed × sprintThrough.fullSpeedFraction`, TUNE 1.0; the doc says up to 1 minute of straight
running) may pass a _breakable_ wall segment: it takes `selfHealthCost` (TUNE 50%) of its own max
health and deals `segmentDamageFraction` (TUNE 50%; "10,000 health → 5,000 damage") of the segment's
base max health through the normal pipeline (shields absorb first; **Recommendation**, the doc is
silent on shields here). The rule is an `AttackStrategy` on the Sentinel, not a special case in
`CollisionSystem`: the resolver asks `collider.onContact(other)` and the Sentinel's strategy answers
`pass-through` or `block`.

## 4. Gates

```ts
// State pattern; ticks per transition come from content
export type GateState = 'closed' | 'opening' | 'open' | 'closing';
```

- `StructureSystem` opens a gate when an allied unit or horde is within `openRadius` and closes it
  when none is (hysteresis via `closeDelayTicks`); transitions take `transitionTicks` (the doc says
  "slowly"; TUNE).
- While `open` or `opening`, the gate's footprint is cleared from `WorldMap` (§10); while `closed`
  or `closing` it is stamped as blocked and is a swept-test collider.
- Fire defence (MVP-if-time): an enemy inside an open gate's footprint takes `fireDamagePerTick`
  through `DamagePipeline` with source = the gate, so deaths have a cause.
- Damage multipliers per attacker class live in `StructureDefinition.damageMultipliers`
  (`{ 'heavy-mob': 1, sentinel: 1, 'magus-ability': 1, default: 0.1 }`, TUNE from "Heavy Minions,
  Sentinels, and Magus' damage abilities do the most damage to gates"). The pipeline reads them by
  the attacker's `definition.damageClass`; nothing in code names a class.

## 5. Turrets

```ts
export type TurretControl = 'auto' | { readonly kind: 'manual'; readonly legendId: EntityId };
export type AmmoDefinition = {
  readonly id: string; // 'bolt-default' | 'bolt-heavy'
  readonly cooldownTicks: number; // TUNE: default 1 bolt / 5 s (150 ticks), heavy 1 / 10 s (300)
  readonly projectileId: string;
  readonly preferredTargetClasses: readonly string[]; // heavy: ['sentinel', 'heavy-mob']
};
```

`TurretController` (in `ai/`) drives auto mode: acquire the first enemy in range, keep it while
alive and in range, prefer by a data priority list, switch ammo to the first `AmmoDefinition`
whose `preferredTargetClasses` includes the target's class, and aim predictively (target position

- velocity × time-to-impact, solved in two iterations with deterministic vector math, no `atan2`).
  Manual mode (MVP-if-time): an Warrior Legend issues the `turret-toggle-control` and
  `turret-switch-ammo` `InputAction`s (bound to P and T by default, rebindable, never hard-coded);
  the turret then fires where the player aims until they leave, and auto resumes. Ammo is data:
  changing rates or adding a third ammo is a content entry, matching the doc's "couple lines" wish.

## 6. Spawners

```ts
// packages/core/src/components/Spawner.ts (sketch)
export type SpawnTable = readonly { readonly mobId: string; readonly count: number }[];
export type SpawnWave = {
  readonly afterTick: number; // first eligible tick (the 60 s countdown for towers)
  readonly everyTicks: number; // cadence (60 s = 1800 ticks for towers, TUNE)
  readonly table: SpawnTable;
};
export type GuardPlan = {
  readonly table: SpawnTable;
  readonly leashRadius: number;
  readonly respawnTicks: number; // TUNE: 2 minutes = 3600 ticks
};
export class Spawner {
  readonly waves: readonly SpawnWave[];
  readonly guards: GuardPlan | null;
  nextWaveTick: number;
}
```

`SpawnSystem` walks every `Spawner` in id order and emits `spawn-requested` events that
`EntityFactory` fulfils at the end of the tick (deferred spawns, deterministic order); a horde
batch is fulfilled in one step together with its horde record ([18](18-minion-system.md) §3.2):

| Source          | Waves                                                                                   | Guards                                    | MVP status  |
| --------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- | ----------- |
| `Stronghold`    | 3 light hordes of 16 at match start (48 units); later light swarms and heavy mobs       | ranged + melee guards, leash to the walls | MVP         |
| `SpawnerTower`  | 1 light horde every 60 s after the 60 s countdown (TUNE)                                | light mob guards                          | MVP         |
| `BuffTower`     | light and medium swarms (TUNE cadence)                                                  | numerous medium guards                    | MVP         |
| `Camp` (forest) | none; a fixed group once the match countdown ends (DEC-167)                             | the group itself, leashed to the camp     | MVP         |
| `Camp` (corner) | a `MiniBoss` + support every 5 min after its death (TUNE); crystal is `never` breakable | boss guards                               | MVP-if-time |
| `Cathedral`     | the gem summons the `GreaterBoss` mid-match via `MatchTimeline`                         | none                                      | phase 3     |

**Implementation status (2026-10-30, #38 fix).** The wave timings in the sketch and table above
predate the owner's spawn timeline, DEC-87 as amended by DEC-127 (FR-005), which the code follows.
Each wave's clock starts when the countdown ends, with no countdown offset. The SpawnerTower sends
light hordes, the BuffTower medium hordes and the Stronghold heavy hordes down the team's
most-struggling lane (DEC-89). The opening hordes are one light horde per lane from the lane's
base at load-in (DEC-87 (e), [18](18-minion-system.md) MS-30), not 3 hordes from the Stronghold.
The values live in `content/structures/spawnWaves.ts`; a wave there carries `firstAtSeconds` and
`everySeconds` in place of `afterTick` and `everyTicks`. The design text above is the owner's to
update.

Guards use `GuardController` with `leashRadius` ("don't leave the tower's perimeter") and respawn
after `respawnTicks` (TUNE: 2 minutes = 3600 ticks). Horde sizes are
`GameConfig.match.hordeSizes` (FR-037) and cadences are spawner data (DISC-10); the owner may move
either ([18-minion-system](18-minion-system.md) §10), and the `Stronghold` and `BuffTower` rows
above follow that answer.

## 7. Capture points

`CapturePoint` is a `Zone` with a `ZoneArea` and a `Capturable` component. A zone covers the floor
of the building its map feature stands for (DEC-145 (a)): an outer capture point the court inside
its fort's walls (a unit in a gateway counts once past their inner face), the middle one the whole
floor of the `Cathedral` to its walls (nave, transept with both chapels, apse). A unit counts when
its centre is on that floor.

```ts
export class Capturable {
  owner: Team; // the last locking state: 'neutral' at match start
  progress: number; // -1..1, negative = dark, positive = light; ±1 = fully captured
  checkpoint: 0 | 1 | 2 | 3;
  lockedBy: EntityId | null; // a living MiniBoss locks the zone
  presence: Record<Team, number>; // each side's summed weight inside this tick
  reached: Record<Team, number>; // each side's highest checkpoint since the last owner change
}
```

`CaptureSystem` applies the owner's capture rules (DEC-86) while `lockedBy === null`:

- **Who counts.** Every living `Unit` whose centre is on the zone's floor counts for its team:
  Legends, minions and neutral-team units. Structures and projectiles never count.
- **Weighted majority.** A side's presence is the sum of its units' weights, and a Legend weighs
  more than any other unit. The side with the highest presence moves `progress` toward itself, at
  a rate that grows with its margin over the next side, up to a cap. When the two highest
  presences are equal, `progress` does not change.
- **Locking states.** Neutral, fully light and fully dark. `owner` holds the last one. A zone
  stays in its locking state until a capture changes it, so an owned zone with nobody inside
  stays owned.
- **Taking an owned zone.** The owner's progress drains to 0 before the taker's fills, and the
  zone stays the owner's until the capture completes.
- **Neutral re-take.** Neutral units with the majority drain the owner's progress to 0, and the
  zone becomes neutral again.
- **Revert.** With no counted unit inside, an unfinished capture slowly moves back to the last
  locking state.
- **Checkpoints.** A side's push on a zone it does not own announces each checkpoint it passes
  (`checkpoint-reached`), once per side until the zone changes owner (DEC-145 (b), (g)): a capture
  that reverts and is pushed again announces only the checkpoints that side had not reached, so
  the assist mobs cannot be farmed for XP. A drain, a revert and an owner refilling its own zone
  announce none. `capture-progress` reports every checkpoint the progress crosses, either way.
- **Density.** Each side's presence is published with the zone's state, and the client shows each
  side's share of the total (DEC-145 (c)): in the world under the progress bar, and on the HUD
  while the player's Legend stands in the zone.

The weights, the rate cap and the revert rate are `TUNE` values in
`GameConfig.match.capturePoints` (DEC-146). A zone's floor comes from its building's geometry,
looked up by map feature kind in `map/zoneArea.ts` (the fort's size and the Cathedral's floor are
in `content/maps/buildingGeometry.ts`); the zone definition has no size.

Reaching a checkpoint (`checkpoint-reached`) spawns that checkpoint's defenders (held by `GuardController` with the zone as home and fighting
for the team that owns the point, [18](18-minion-system.md) MS-28, §7.1) through a `Spawner` table (1: medium assist mobs; 2: heavy plus light assist mobs; 3: one massive
"Balrog-type" mob) and, when cleared, awards XP shared among nearby allies biased toward the top
damage dealer (`ProgressionSystem` listens to `checkpoint-cleared`). Holding a zone applies
`StatusEffects` from content: ability/ultimate cooldown reduction and, after `levelUpAfterTicks`,
a level-up for that side's lane minions; both are removed on loss. Mini-bosses at the quarter mark
lock the outer zones (`lockedBy`) until they die (`MatchDirector` timeline).

## 8. Structure destruction effects

| Event                          | Effect (all data in content)                                               | MVP status |
| ------------------------------ | -------------------------------------------------------------------------- | ---------- |
| any lane structure destroyed   | `enraged` status on enemy minions in that lane (lane gets harder)          | MVP        |
| `SpawnerTower` destroyed       | stronghold guard table shrinks; walls lose a bar if it was a shield source | MVP        |
| `BuffTower` destroyed          | its shield bars removed everywhere; team buff and enemy debuff aura end    | MVP        |
| `Gate`/`WallSegment` destroyed | footprint cleared; flow fields rebuilt; minimap terrain dirty              | MVP        |
| `Stronghold` destroyed         | `match-ended` with the winner                                              | MVP        |

Every effect is a listener on `structure-destroyed` in the owning system; `StructureSystem` never
calls another system (rule 12).

## 9. Obstacles

`Obstacle` is a concrete entity whose kinds are data:

```ts
// packages/core/src/content/obstacles/ObstacleDefinition.types.ts (sketch)
export type ObstacleDefinition = {
  readonly id: string; // 'oak-tree' | 'boulder' | 'bridge-segment'
  readonly kind: 'tree' | 'rock' | 'bridge-segment';
  readonly footprint: ConvexPolygon;
  readonly health: number | null; // null = unbreakable (isBreakable false)
  readonly isBurnable: boolean;
  readonly fell: FellEffect | null; // { length, damage, trunkWeight }; null = does not fall
  readonly weight: number; // for Carry capacity checks
  readonly minimapGlyph?: MinimapGlyph;
};
```

- Breakable vs unbreakable is the `health` field; unbreakable obstacles are swept-test colliders.
- Burnable obstacles take `burning` status damage (post-MVP unless fire abilities land).
- A fellable tree that dies falls away from its killer: units in the fall capsule take
  `fell.damage`, cells under the trunk are re-flagged (`terrain-changed`, "breaks the ground"), and
  the obstacle becomes a `felled-trunk` obstacle with `weight = trunkWeight` that a unit with
  `Carry.capacity >= weight` can pick up (`Carry` component, `PickUpStrategy` per class:
  Warrior low, Magus medium, Sentinel high; **MVP-if-time**).

## 10. Destructible terrain pipeline

```mermaid
flowchart LR
  D[DeathSystem: RemovalCause] --> E[structure-destroyed / obstacle-destroyed / gate-state-changed]
  E --> W[WorldMap.clearFootprint or stampFootprint]
  W --> F[PathingSystem: mark lane fields dirty, rebuild with a cell budget]
  W --> S[SnapshotSystem: terrainVersion++]
  S --> V[TerrainView and MinimapView redraw dirty chunks]
```

The rebuild is time-sliced (Emerson, [research §3](../research/game-architecture-and-performance-research.md#what-this-means-for-eternalus-a-pipeline-for-300-units));
until a field is rebuilt, units keep following the old field and the collision system keeps them
out of the still-stamped cells, so nothing tunnels during the gap.

## 11. Events and invariants

Emitted (typed `GameEvents`): `structure-damaged`, `shield-bar-removed`,
`structure-breakability-changed`, `structure-destroyed`, `gate-state-changed`,
`turret-control-changed`, `turret-fired`, `spawn-requested`, `capture-progress`,
`checkpoint-reached`, `checkpoint-cleared`, `capture-point-captured`, `obstacle-destroyed`, `tree-felled`,
`terrain-changed`, `entity-removed { cause: RemovalCause }`.

| Invariant (`diagnostics/`)             | Kind  | Checks                                                                         |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------ |
| `NoPassThroughUnbreakableInvariant`    | light | no `collision-anomaly` for colliders with `isUnbreakable`                      |
| `NoRemovalWithoutCauseInvariant`       | light | every `entity-removed` carries a `RemovalCause` (killer, despawn rule, script) |
| `ShieldBarsMatchLivingTowersInvariant` | heavy | bars on each structure = living allied buff towers                             |
| `HealthWithinBoundsInvariant`          | light | `0 <= base <= baseMax`, every bar `0 <= current <= max`                        |
| `BreakabilityMatchesRuleInvariant`     | heavy | `isUnbreakable` equals the rule evaluated from scratch                         |
| `GateFootprintMatchesStateInvariant`   | heavy | closed gates are stamped in `WorldMap`, open ones are not                      |

These are the requirements doc's runtime checks ("entity passes through an unbreakable object",
"despawns without something else removing it") expressed as `Invariant` classes run by
`InvariantRunner` (see `15-diagnostics-and-runtime-testing.md`).

## 12. Minimap appearance

Every `StructureDefinition` and `ObstacleDefinition` carries an optional `minimapGlyph`
(`06-map-and-minimap.md` §8). `WallSegment`s and towers use team-coloured glyphs; camps neutral
dots; capture points the glyph of the map feature that places them, coloured by
`Capturable.owner`. No view code per kind: `MapView.drawMinimap` draws every feature's glyph. The
default entity view draws no minimap marker; only Legends and mobs have one, from their own views
(06 §8, DEC-187).

## 13. Extension recipe: a new structure type

1. Add a `StructureDefinition` entry in `content/structures/` (health, `shieldFractions`,
   `breakability`, footprint, `damageMultipliers`, optional `spawner`, `minimapGlyph`).
2. Add a subclass under `entities/structures/` **only** if its lifecycle differs (otherwise reuse
   an existing class with the new definition). Depth stays ≤ 3 below `Entity`.
3. Add the kind to `MapFeatureKind` and one `EntityRegistry` line (feature kind → factory).
4. Add a `MapBuilder` step so the generator places it (presets never place features, DEC-14).
5. Optional: an `EntityView` in `ViewRegistry` for the main canvas; the minimap needs nothing.
6. Tests: the definition validates, the mirror test still passes, the minimap glyph test counts it.

Nothing in `StructureSystem`, `DamagePipeline`, `SpawnSystem` or `MinimapView` changes.

## 14. Post-MVP items

- **Anti-air defence** (orange in the game doc): a `Combat` targeting filter on `height > 0` once the
  Flying class exists; the `Turret` class does not change, only an `AmmoDefinition` and a
  `TargetingStrategy`.
- **Form change at buildings** (yellow): an `Interactable` component on `Stronghold`/`BuffTower`
  that emits `form-change-requested`; the Legend side is a `LegendSpecDefinition` swap (D11).
- **Bridges** across the rift as `bridge-segment` obstacles are MVP-if-time; until then the rift
  gaps are plain walkable ground.

## 13. Implementation status

Sprint 1.2 (PR #14) ships the `Structure` base, the `Obstacle` class and layered shields on
`Health`, with these interim differences:

- `Structure` and `Obstacle` use a circle `Collider` from `footprintRadius`; convex polygon
  footprints arrive with the structures in Phase 2. No concrete structure kind or content existed until the minion slice below.
- `Health` keeps `current`/`max` for the base bar and adds `shields`, `total`, `addShield` and
  `removeShield`; bars stay in source id order.
- **Minion slice (`feat/minion-structures`, 2026-10-30).** The lane structures exist as entities:
  `Stronghold`, `SpawnerTower`, `BuffTower` and `Gate`, with `content/structures/structureCatalogue.ts`
  (base health from `balancing.md`) and their registry lines. `Simulation` builds one per map
  feature with a structure definition, in feature id order, carrying the feature's lane
  (`Structure.laneId`). `BreakabilityRule` (§3, without `all-of`) is evaluated by `StructureSystem`,
  which also emits `structure-destroyed`; `BreakabilityStep` blocks damage to unbreakable targets.
  The BuffTower total is `numLanes × buffTowersPerLane` from config. Not built yet: shield bars
  from BuffTowers, the `all-of` rule, the §11 invariants (`BreakabilityMatchesRuleInvariant`,
  `NoPassThroughUnbreakableInvariant`), the gate state machine, damage multipliers, walls,
  turrets and the Cathedral as entities, and clearing a destroyed structure's footprint from
  `WorldMap`; the main view draws structures from the map layer (`StructureView` draws nothing).
  Minion plan M6 adds `Camp` (forest camps, rule `never`, circle radius 1 `TUNE`, since camp
  features have no footprint); its group is a guard plan (18 §7.1), not a `Spawner` component yet.
- **Minion follow-ups (`fix/minion-stack-followups`, 2026-11-05).** Lane towers and the
  Stronghold also carry a `Footprint` component: the polygons of their map object of the same id
  (a tower's fort, the Stronghold's palace outline), which `Simulation` copies for a definition
  with `hasMapFootprint`. Attack reach to the structure is measured to those outlines, and a chase
  aims at their nearest point, or holds inside them (DEC-234), so a hit on a fort wall is a hit on the tower and melee at the
  palace wall reaches the Stronghold (DEC-185, DEC-185 (D)). The circle `Collider` stays. A lane
  tower's fort map objects, which block, are the tower's body: they have no health of their own,
  so damage to the fort goes to the tower (one pool, DEC-185 (B)). Only towers share one pool
  with their fort (DEC-217 (13)): the Stronghold's palace map object and a gate's map object do
  not block, so both keep their own health. `Simulation` takes the structure
  definitions from one injected source (`SimulationOptions.structures`, default
  `STRUCTURE_DEFINITIONS`) for the structures it builds and for `StructureSystem` (DEC-168 B8).
- **Tower ruins and gate reach (`feat/tower-ruins-and-routes`, 2026-11-05).** Each of a lane
  tower's 11 fort wall pieces, its 7 walls and its 4 corner towers (DEC-227 (Q-C), 2026-11-09), is
  its own `wall` map object, `partOf` the tower (`MapObject.partOf`); the tower's own object of the
  same id holds its keep, and the tower's `Footprint` is all of them. When the tower dies, its fort
  becomes ruins (DEC-217 (12), DEC-219 (a)). `StructureRuins` holds that rule, and
  `MapDestructionSystem` runs it from its `entity-died` and `entity-removed` listeners;
  `WorldObjectStore` keeps only object identity and destroyed state. The tower's own object and
  the wall piece that took the killing hit are destroyed (the piece nearest the killer when the
  hit lands; none when the keep is nearer, or the killer has no position). The system reopens
  their cells and the court's through `MatchWorld.reopen`; `MatchWorld.build` holds the rule that
  stamps the grid. Each other piece stands as teamless scenery with half a wall's own health
  (`RUINED_FORT_WALL_DEFINITION` in `content/maps/mapObjectDefinitions.ts`) and blocks until it is
  destroyed on its own. A gate's definition now has `hasMapFootprint` too, so reach to a gate is
  measured to its polygon (DEC-217 (17)); `hasFortBox` keeps a gate's box out of the chase rule's
  fort boxes, which the towers and the palace keep (DEC-217 (16)).
- **Court routes and fort spacing (`feat/tower-ruins-and-routes`, 2026-11-09).** Routes into and
  out of a standing tower's court are built (DEC-217 (15)): the court is court ground in the nav
  grid (06 §6), which lane flow fields treat as blocked and A\* walks, so every route through a
  court uses its doorways, and a mob in a court leaves by the nearest doorway (10 §9). Court
  ground needs nav cells thinner than every fort wall piece, so the cells are 2.5 m, down from
  5 m (DEC-227 (Q-A); the value is `config.map.navCellSize`). Lane towers of one kind stand at
  least a fort box's diagonal apart along their lane, so their forts do not overlap (DEC-227,
  06 §3).
- `ObstacleDefinition` keeps `kind: 'obstacle'` (the entity class) and moves tree/rock/bridge to
  `obstacleType`; `fell` and `minimapGlyph` arrive with felling and the minimap work.

**2026-10-27 (PR #30, map objects).** Generated map objects currently reuse the `Obstacle`
entity with a `MapObjectBody` component while the full structure family remains planned.
`WorldObjectStore` retains health and destruction records after entity removal. Definitions live
in `content/maps/mapObjectDefinitions.ts`; scenery health is the owner ruling DEC-121 (b), 100 HP
for this sprint. Terrain and the Cathedral remain indestructible. Destroying a main building also
destroys its owned walls and furnishings through the damage pipeline. Ruins remain in snapshots
and rendering but release their collision footprints.

The Structure family replaces this stand-in in Phase 2 sprint 2.1. Until then a side's map
objects carry its team (`MapObject.team`), so only the other side can attack them (DEC-121 (a)).
Blocking footprints already block the pathing grid and a destroyed one reopens its cells; the
`terrain-changed` event follows in sprint 2.5. The game-loop integration uses `GameState.livingBuffTowerCount(team)`:
only living `structure` / `buff-tower` entities with the owning team's membership count.
Decorative obstacle proxies never grant King immunity. The King's victory and immunity damage
step remain owned by the game-loop work. The hall's throne anchor and room bounds are content
in `buildingGeometry.ts`; the hall rotates toward the middle entrance before ring scaling.

Capture points (PR #64, DEC-86 and DEC-145 rules) ship as `CapturePoint` zones with a `ZoneArea`
and a `Capturable` component, one per `capture-point` and `cathedral` map feature
(`content/zones/`), moved by `CaptureSystem` with the weights and rates of
`GameConfig.match.capturePoints`. `Simulation` computes each zone's floor from the map alone
(`map/zoneArea.ts`) instead of taking it as an explicit placement (06): zones come from the map,
so a replay or a match without map objects rebuilds the same zones. Interim differences:

- `lockedBy` is always `null`: the mini-boss lock arrives in Phase 3 sprint 3.6.
- Scheduled later, through the two capture events: holding buffs (Phase 3 sprint 3.3), score
  (sprint 3.5), checkpoint defender spawns (Phase 3) and checkpoint XP (Phase 4). The minimap glyph
  does not follow the owner yet (the minimap entity markers, SCRUM-151).
- The density numbers on the HUD arrive with the HUD work (`feat/hud-and-character-select`, its
  capture tracker); this PR publishes the presence and draws the split bar in the world.

## Related

- [04 Entity architecture](./04-entity-architecture.md)
- [06 Map and minimap](./06-map-and-minimap.md)
- [10 Physics](./10-physics.md) (colliders, swept tests, `unbreakable` semantics)
- [11 Game AI](./11-game-ai.md) (`GuardController`, `TurretController`)
- [12 Game story and match director](./12-game-story-and-match-director.md) (timeline, bosses)
- [15 Diagnostics and runtime testing](./15-diagnostics-and-runtime-testing.md)
- [17 Extension recipes](./17-extension-recipes.md)
- [Reference: structures and defences](../reference/game-design/03-structures-and-defenses.md)
- [Reference: objectives, capture points and bosses](../reference/game-design/04-objectives-capture-points-and-bosses.md)
