---
title: Entities and units
description: Every kind of unit in a match (Legends, minions and hordes, guards, neutral camp units, bosses, the Rover), the shared entity stat set and the unit caps; read it before working on spawning, AI or unit content.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, game-design, entities, units, minions, hordes]
paths:
  ['packages/core/src/content/mobs/**', 'packages/core/src/entities/**', 'packages/core/src/ai/**']
related:
  - 'docs/reference/game-design/01-classes-and-subclasses.md'
  - 'docs/reference/game-design/04-objectives-capture-points-and-bosses.md'
  - 'docs/architecture/04-entity-architecture.md'
  - 'docs/architecture/11-game-ai.md'
---

# Entities and units

**Purpose.** Read this when you need to know what moves on the map and how it behaves: how many
Legends there are, how minions spawn and scale, what guards and camps do, which bosses exist and
what the Rover is. It also fixes the entity stat set and the unit caps that the simulation is
engineered against. Structures are in `03-structures-and-defenses.md`; objectives and boss
mechanics in detail are in `04-objectives-capture-points-and-bosses.md`.

## The entity families

The canonical taxonomy (brief decision D4, ADR 0006; max depth 3 below `Entity`):

```text
Entity (abstract: id, kind, definitionId, components)
├─ Unit (abstract: mobile; Health, Movement{speed,maxSpeed,acceleration,mass}, Combat, Team, Collider(circle))
│  ├─ Legend (abstract: 3 abilities + ultimate, 2 gadget slots (artifacts), Loadout, Progression, aether)
│  │  ├─ Assault, Sentinel, Magus (concrete), [Flying] (post-MVP; reserved)
│  ├─ Mob (abstract: lane/guard/camp units; belongs to a Horde or a Spawner; team may be neutral)
│  │  ├─ LightMob, MediumMob, HeavyMob (concrete weight classes)
│  └─ Boss (abstract: multi-move FSM, zone-restricted)
│     ├─ MiniBoss (outer capture points at the quarter mark; corner camps)
│     └─ GreaterBoss (the central "Eternal" boss summoned mid-game from the Cathedral gem)
├─ Structure (abstract) … see 03-structures-and-defenses.md
├─ Zone (abstract) → CapturePoint
├─ Obstacle (concrete; tree, rock, bridge-segment)
└─ Projectile (concrete; pooled)
```

Deviation from the requirements doc, recorded as decided (D10): the requirements doc sketches a
separate "neutral entity" branch (light/medium/heavy camp, boss). In our model **team is a
property/component, not a class**: camp units are `Mob`s with `team = 'neutral'`, the camp
itself is a `Camp` structure, and bosses are `Boss` units. Reason: units change team at runtime
(a Necromancer revives fallen entities "to fight for their team"; a minion that kills a player
ascends), so a team-based class hierarchy would force re-instantiation.

## Legends

- 10 per team: **3 per lane on three lanes plus 1 Rover per team**, a 10v10 simulation (game
  doc). In the MVP one Legend is human-controlled; every other Legend is a bot (requirements
  doc: "all bots except 1 user controlled character").
- The player's team is chosen at random (requirements doc: "Allied team, Enemy team … (randomly
  chosen for player)").
- Classes and their sizes, passives and movement profiles: `01-classes-and-subclasses.md`.
- Every Legend has 3 abilities plus an ultimate, two gadget slots holding artifacts, a loadout, a
  progression (XP, level) and an aether pool (`06-abilities-and-progression.md`,
  `08-loadout.md`).
- Bot Legends are driven by a `BotLegendController` (behaviour tree); the human by a
  `PlayerController` that consumes input intent. Both emit the same `Command`s.

Status: **MVP** (3 classes; Flying post-MVP).

## Minions and hordes

The sources call lane units "mobs" (original notes) and "minions" (team meeting); they mean the
same thing. A group that spawns and travels together is a **horde** (the sources write "hoard"
and ask for a better name; see `../suggestions/naming.md`).

### Weight classes and horde sizes

| Weight class | Code name   | Horde size `TUNE` | Notes from the sources                                                                            |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| Light        | `LightMob`  | 16                | Spawned by SpawnerTowers ("groups of light mobs"), BuffTowers and the Stronghold ("Light swarms") |
| Medium       | `MediumMob` | 8                 | Spawned by BuffTowers ("light and Medium mob swarms"); BuffTower guards are medium                |
| Heavy        | `HeavyMob`  | 4                 | Spawned by the Stronghold ("Heavy Mobs"); heavy waves are the corner-camp reward                  |

Horde sizes are from the requirements doc's MVP list. Status: **MVP**.

### Spawn cadence (MVP)

From the requirements doc, all values `TUNE`:

1. Match start: a 1-minute countdown. Nothing spawns from towers; only **3 hordes spawn from
   each Stronghold, 1 per lane, 48 units in total** (3 × 16 light).
2. After the countdown, **minions spawn from towers every 1 minute**. Both tower types spawn:
   SpawnerTowers ("Mob spawn") and BuffTowers ("also spawners").
3. Camps do not spawn units until after their own cooldown (see Neutral camp units).

The game doc adds what each spawner produces (table in `03-structures-and-defenses.md`):
SpawnerTowers spawn light groups; BuffTowers spawn light and medium swarms; the Stronghold spawns
light swarms and heavy mobs. Which of these run on the 1-minute cadence and whether the
Stronghold keeps spawning after the opening 48 is not stated; it is an open question
(`12-open-questions.md`) and, until decided, a `MatchTimeline` content value.

### Behaviour and scaling (game doc)

- Hordes travel together toward the nearest objective in their lane.
- **Strength scales with distance from the home Stronghold** (vector math): the closer to home,
  the stronger the minion. Strength evens out in the middle, which prevents early rushes.
  Status: **MVP** (it is the anti-rush mechanic the lane design relies on; a single scaling
  function in content).
- **Enraged**: destroying a structure gives the enemy minions on that lane an "enraged" buff, so
  a lane gets harder to push through after a structure falls, not easier. Status: **MVP**.
- **Zone level-up**: holding a middle capture zone long enough levels up friendly minions on that
  side (and reduces ability and ultimate cooldowns); the buff is lost if the zone is lost.
  Status: **MVP** (it is part of the central capture points, which are in the MVP list).
- **Minion XP**: a minion that kills another minion earns XP. After two kills `TUNE` it levels
  up and buffs nearby friendly minions. Status: **MVP-if-time**.
- **Ascend**: a minion that kills a player ascends: it grows larger and gains additional buffs.
  Status: **MVP-if-time**.
- **Assist mobs** spawn from capture-point checkpoints (medium at checkpoint 1; heavy plus some
  light at checkpoint 2; one massive Balrog-type mob at checkpoint 3). See
  `04-objectives-capture-points-and-bosses.md`. Status: **MVP** for the checkpoints themselves;
  the Balrog-type mob is **MVP-if-time**.

## Guards

Every team structure is defended by guards that **do not leave the structure's perimeter and
respawn every 2 minutes `TUNE`** (game doc, Buildings table):

| Structure    | Guards                                      | Self-defence                                      |
| ------------ | ------------------------------------------- | ------------------------------------------------- |
| SpawnerTower | Light mob guards                            | Ranged and melee self-defence                     |
| BuffTower    | Numerous medium mob guards                  | Debuff aura and ranged self-defence               |
| Stronghold   | Ranged and melee mobs; turrets on the walls | Destructible walls; debuffs enemies, buffs allies |

Destroying SpawnerTowers "reduces the capital's guards and weakens its walls". Guards are
`Mob`s with a `GuardController` (leash to the perimeter, return home, respawn timer owned by the
structure's `Spawner` component). Status: **MVP**.

## Neutral camp units

Two kinds of neutral camp exist in the sources; both hold `team = 'neutral'` units that attack
either team.

- **Forest camps** (requirements doc): 6 per team side, placed between the lanes (1 lane → 3
  camps → middle lane → 3 camps → 1 lane). Camps do not spawn units until after a cooldown
  `TUNE`. The requirements doc names light, medium and heavy camps; which camp is which weight
  is not specified. Status: **MVP**.
- **Outer (corner) camps** (game doc): fortified neutral camps surrounded by impassable rifts,
  each unique in design, holding high-level mini-bosses from the start of the game, with an
  unbreakable crystal that spawns new bosses every 5 minutes `TUNE` after a mini-boss's death.
  Killing the boss and its supporting minions gives the team XP and sends a heavy-minion wave
  from your Stronghold down your worst-off lane. Status: **MVP-if-time** (the game doc files it
  under "included in MVP if possible"; the brief lists it as post-MVP unless time allows). Full
  rules in `04-objectives-capture-points-and-bosses.md`.
- **Minion buffs on boss spawn** (game doc): when the middle boss spawns, all neutral camps
  become stronger and more aggressive, and the corner camps begin spawning waves of light/medium
  enemies that attack lanes from the sides, every 4 minutes `TUNE`, guarded by a heavy
  mini-boss. Status: **MVP-if-time**.

Camp units use seek/arrival within a leash radius and return home when the leash breaks
(`../../research/game-architecture-and-performance-research.md#3-pathfinding-and-movement-for-lane-minions-and-large-unit-counts`).

## Bosses

| Boss                                     | Code name     | Where and when                                                                                  | Status          |
| ---------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| Mini-boss                                | `MiniBoss`    | Top and bottom lane capture zones at the quarter mark of the match; corner camps from the start | **MVP**         |
| Greater boss, "Eternal" (rename pending) | `GreaterBoss` | Summoned mid-match when the gem in the central Cathedral explodes; belongs to no team           | **MVP-if-time** |

Both are Souls-like: multiple moves, never standing still, high damage and health, restricted to
their zone, and they fight any player or team-associated mob. The mini-boss takes multiple
players to defeat; the Greater Boss is "obscenely massive" and "far more brutal". Rewards,
the Eternal form for the final-hit player and the map-wide atmosphere change are in
`04-objectives-capture-points-and-bosses.md`. The name "Titan" for this boss is **removed** (red
in the game doc); "Eternal" is the current placeholder. Bosses are driven by a `BossController`
(FSM over moves).

Scope note: the requirements doc's MVP list names "neutral camps/bosses/mini-bosses" but the
central boss is not itemised there, hence **MVP-if-time** for the Greater Boss; the architecture
treats it as a second `Boss` subclass with its own moves in content.

## The Rover

Each team has one Rover, the tenth Legend, not tied to a lane. "The enemy Rover is a hard bot:
it reacts to structure health and mirrors or targets the player." In the MVP both Rovers are
bots ("All non-player characters are bots, including the enemy Rover"). The Rover is a Legend
(any class) with a `RoverController` instead of a lane-bound behaviour tree; the ally Rover uses
the same controller against the enemy human-equivalent (the enemy team has no human, so
`Recommendation:` the ally Rover targets the enemy Legend with the highest threat score).
Status: **MVP**.

## The entity stat set

Every `Unit` carries at least these fields (game doc, Entity Class Specifics; brief §2):

| Field          | Component  | Meaning                                                                                             |
| -------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `health`       | `Health`   | Current and max health; structures add layered shield bars on top (`03-structures-and-defenses.md`) |
| `speed`        | `Movement` | Base speed (the "low speed" of a Sentinel is this stat)                                             |
| `maxSpeed`     | `Movement` | Top speed reached by sustained movement/sprint (a Sentinel has one of the highest)                  |
| `acceleration` | `Movement` | How fast speed approaches `maxSpeed` (a Sentinel's is slow; "they need a lot of runway")            |
| `mass`         | `Movement` | Weight for knockback and momentum ("a weight or mass field"); also the pick-up weight check         |
| size           | `Collider` | Circle radius; class sizes in `01-classes-and-subclasses.md`                                        |

Plus `Team` (`light`, `dark`, `neutral`), `Combat` (attack, damage type, range), `StatusEffects`
(enraged, crushed, concussion, bleed, …), and for Legends `Abilities`, `Progression`, `Loadout`,
`Carry`, `Vision`. All numbers are content (`packages/core/src/content/`), never literals in
systems.

## Unit caps and scale

From the requirements doc (developer menu), all `TUNE`:

- **Max 10 Legends per team** ("add/remove legends (max 10)").
- **Max 144 units per team** ("spawn mobs from different origin points (max 144 units per team;
  shouldnt crash)"). The product owner's benchmark: Total War and BFME mods handle thousands;
  "should be able to support hundreds per team but keep low for MVP".
- A **sim mode** removes or adds the user-controlled Legend so a match can run with bots only.

The architecture target is therefore ~300 moving units at 30 ticks/s with flow-field pathing
and a spatial hash (`../../architecture/10-physics.md`, `../../architecture/11-game-ai.md`).
`GameConfig` carries the caps (`maxLegendsPerTeam`, `maxUnitsPerTeam`) and the developer menu
reads them; the `SpawnSystem` refuses to exceed them and emits a diagnostic event instead of
crashing.

## Engineering notes

- Single place of change: a new unit kind is one `Mob`/`Boss` subclass (only if its behaviour is
  unique), one content definition under `content/mobs/`, one `EntityRegistry` line, and, if it
  needs new decisions, one controller under `ai/`. Weight classes are concrete subclasses because
  they differ in behaviour (horde formation, gate/wall damage rules), but their numbers are data.
- `Horde` is **not** an entity: it is a Composite of Mob ids with a lane, formation and leader,
  managed by `HordeSystem`. Spawning is `SpawnSystem` reading the `MatchTimeline` and each
  structure's `Spawner` component.
- Team changes (revive, ascend) mutate the `Team` component and emit a `GameEvents` event; no
  entity is re-created.
- Minion strength scaling is one pure function `strengthAt(distanceFromHome)` in content, applied
  by `ProgressionSystem`, so balancing never touches a system.

## Related

- [Classes and sub-classes](01-classes-and-subclasses.md)
- [Structures and defences](03-structures-and-defenses.md)
- [Objectives, capture points and bosses](04-objectives-capture-points-and-bosses.md)
- [MVP scope](11-mvp-scope.md)
- [Open questions](12-open-questions.md)
- [Architecture: entity architecture](../../architecture/04-entity-architecture.md)
- [Architecture: game AI](../../architecture/11-game-ai.md)
- [Architecture: game story and match director](../../architecture/12-game-story-and-match-director.md)
- [Research: pathfinding for large unit counts](../../research/game-architecture-and-performance-research.md#3-pathfinding-and-movement-for-lane-minions-and-large-unit-counts)
- [Verbatim source](../source/game-project-eternalus-v2.md)
