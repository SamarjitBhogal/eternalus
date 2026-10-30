---
title: Minion system plan
description: The build plan for the minion system of architecture doc 18 and every other AI-driven enemy except bosses and turrets - phases M1 to M6 and M8 with their contents, blockers and done-when checks, who builds the dependencies, the pull requests they ship as, the interim stand-ins each phase uses with the phase that removes them, and a coverage table of every AI-driven entity and where it is built; read this before picking up any minion, horde, guard, camp, spawning or bot task.
audience: [humans, agents]
status: draft
owner: SamarjitBhogal
last-reviewed: 2026-10-30
tags: [plan, minions, hordes, guards, camps, bots, spawning, ai]
related:
  - docs/architecture/18-minion-system.md
  - docs/plan/phase-3-minions-hordes-and-ai.md
  - docs/plan/phase-2-structures-and-combat.md
  - docs/plan/backlog-post-mvp.md
  - docs/architecture/11-game-ai.md
---

# Minion system plan

**Purpose.** Read this before you pick up minion or enemy AI work. It orders the design of
[18-minion-system](../architecture/18-minion-system.md), and the enemy controllers of
[11-game-ai](../architecture/11-game-ai.md) §4 except the boss and turret controllers, into phases M1 to
M6 and M8, each with its blockers and a done-when check. There is no M7: it was bosses, which
stay outside the minion system (MS-28). It lists the interim stand-ins a phase uses until a later one
replaces them, and (§1.1) every AI-driven entity with the phase or sprint that builds it. Section
and decision numbers (§, MS-n) refer to doc 18.

**Relation to Phase 3 (MS-28, owner sign-off 2026-10-27).** This plan takes over the breakdown, blockers and pull
requests of these Phase 3 items: sprint 3.1 (mob classes, `Horde`, `HordeSystem`, the minion
modifiers), sprint 3.2 (flow fields, steering and A\* for Legends), sprint 3.3 (controllers,
`MinionController`, targeting), sprint 3.4 (`GuardController`, forest camps, checkpoint assist
spawns) and sprint 3.7 (`BotLegendController`, `RoverController`, ability use). Sprints 3.5
(`MatchDirector`), 3.6 (bosses and `BossController`: the minion system does not control bosses)
and 3.8 (sim mode and the soak) stay in the [Phase 3 plan](phase-3-minions-hordes-and-ai.md). No
Phase 3 scope is dropped and the moved items still ship inside Phase 3's weeks. This amends
DEC-47's split.

## 1. Phases and blockers

| Phase              | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Blockers                                                                                                                                                          | Done when                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 Marching**    | Delete the PROTO-01 escort, its `AiSystem` and `Brain` (DEC-35); light, medium and heavy mob content; `Horde`, `HordeSystem` and the `ranks` formation; `SpatialHash`; `LaneFollowMovementStrategy`; `Spawner` data, `SpawnSystem` and the one-step spawn fulfilment (§3.2) with the DISC-10 schedule, `LaneAssessment` (§3.3) and the unit cap with its `TeamState` counters                                                                                                         | none                                                                                                                                                              | Each team's hordes spawn on schedule and march their lane in formation to the enemy end; `git grep 'PROTOTYPE(PROTO-01)' -- packages apps` finds nothing; the replay hash is stable across two runs of the minion fixture |
| **M2 Fighting**    | Brains as plain data in state (moved from M1, where nothing reads one); `Perception`; `dev-spawn-mobs` hordes; `MinionController` with aggro content and the shared ranking helper; `stop` clears the attack target (`StopHandler`, 03 §3); lane-order objectives in the `WorldMap` structures index and gate holding; spawners on real structures; `LaneAssessment`'s structure terms; `GuardController`, `LeashedChaseMovementStrategy`, guard respawn, `GuardWithinLeashInvariant` | damage pipeline (sprint 2.2, PR #34), structures and breakability (sprint 2.1)                                                                                    | The opening hordes of both teams fight to a result; guards never leave their perimeter in a soak; every FSM transition is tested                                                                                          |
| **M3 Bot laners**  | Lane assignment at match setup (§8); the laner tree of doc 11 §4.2 playing its lane                                                                                                                                                                                                                                                                                                                                                                                                   | M2                                                                                                                                                                | A laner pushes, retreats and returns; lanes respect `legendsPerLane` with the human counted and the Rover excluded                                                                                                        |
| **M4 Flow fields** | Flow fields per lane and team (10 §9, FR-038), including the Stronghold-to-gate ground; lane following on flow fields behind the same strategy                                                                                                                                                                                                                                                                                                                                        | M1                                                                                                                                                                | Hordes reach the enemy end with 0 stuck units for `numLanes` 3 and 5; a gate change re-routes the field within the per-tick cell budget                                                                                   |
| **M5 Modifiers**   | Before the MVP ships: strength by distance (MVP-full, DISC-24) and enraged (MVP). MVP-if-time: minion XP and level-up, the ghosted first wave, Tower Guardians                                                                                                                                                                                                                                                                                                                        | M2                                                                                                                                                                | Each modifier is a content table with a scenario test; the MVP items are done before the MVP ships, the MVP-if-time items when time allows                                                                                |
| **M6 Camps**       | Forest camps: the `Camp` spawner's group, spawned after its activation cooldown and held by `GuardController` with the camp as home (18 §7.1); `camp-cleared`, added to 03's event catalogue. Checkpoint assist spawns: `CaptureSystem`'s checkpoint tables spawned through `SpawnSystem` and held by `GuardController` with the capture point as home. Corner camps (MVP-if-time) are a second `Camp` definition                                                                     | M2c; `Camp` (sprint 2.1), `CaptureSystem` (sprint 2.6); the owner's answer on the checkpoint defenders' leash and their team at an unowned point (18 §10, item 4) | Camps are inert before their cooldown and emit `camp-cleared` when emptied; each checkpoint spawns its listed composition; no camp mob or zone defender leaves its leash in a soak (`GuardWithinLeashInvariant`)          |
| **M8 Rover**       | `RoverController` (11 §4.7) with its considerations and the `rover` difficulty; A\* for Legends (10 §9) as a second `MovementStrategy` for bots off the lane flow fields; bot ability use through `cast-ability` (11 §4.2)                                                                                                                                                                                                                                                            | M3, M4; abilities (Phase 4, stubbed until then)                                                                                                                   | The Rover moves to the lane with the lowest allied structure health; A\* finds the shortest path around a stamped footprint; the tree's `cast-ability` commands need no controller change when Phase 4 lands              |

Every phase also meets the cost and determinism rules of doc 11 §5–§6 and the performance targets
of the Phase 3 plan (pathing plus steering, tick time at `GameConfig.limits.maxUnitsPerTeam`).

**Who builds the dependencies.** The damage pipeline (Phase 2 sprint 2.2) and structures (sprint
2.1) are built by other developers and consumed here. The minion work builds `SpatialHash` (Phase 1
sprint 1.3) and `Spawner`/`SpawnSystem` (Phase 2 sprint 2.7). Removing the PROTO-01 escort
overlaps work item W6 of the [multiplayer and scalability plan](multiplayer-and-scalability-plan.md);
whichever lands first does it.

Camps, checkpoint defenders, turrets and the Rover need structures, capture points,
projectiles and the match director, all built by other developers (Phase 2 sprints 2.1, 2.3 and
2.6; Phase 3 sprint 3.5) and consumed here.

### 1.1 Coverage: every AI-driven entity

Every entity a controller drives, with the doc that designs its behaviour and where it is built.
Turrets and bosses are the AI entities this plan does not build: the turret controller ships
with the `Turret` entity, and bosses keep their own controller in Phase 3 sprint 3.6.

| Entity                                           | Controller                       | Behaviour designed in | Built in                                 |
| ------------------------------------------------ | -------------------------------- | --------------------- | ---------------------------------------- |
| Light, medium and heavy lane minions (in hordes) | `MinionController`               | 18 §6                 | M1, M2                                   |
| Tower guards                                     | `GuardController`                | 18 §7                 | M2                                       |
| Forest and corner camp mobs                      | `GuardController` (camp home)    | 18 §7.1               | M6                                       |
| Checkpoint assist defenders                      | `GuardController` (zone home)    | 18 §7.1               | M6                                       |
| `MiniBoss`, `GreaterBoss`                        | `BossController`                 | 11 §4.6               | Phase 3 sprint 3.6 (not this plan)       |
| Bot Legends (laners)                             | `BotLegendController`            | 11 §4.2, 18 §8        | M3, M8 (A\*, abilities)                  |
| The Rover (both teams)                           | `RoverController` / `rover` role | 11 §4.7               | M8                                       |
| Turrets                                          | `TurretController`               | 11 §4.5, 07 §5        | Phase 2 sprint 2.3, with the `Turret`    |
| The human's Legend                               | `PlayerController`               | 11 §4.1               | not an enemy bot; sim mode is sprint 3.8 |

**Placeholder numbers.** Medium and heavy mob stats start as `TUNE` placeholders in content,
scaled from the light minion, until balancing (Phase 6).

## 2. Pull requests

The phases ship as these pull requests, one task branch each, in this order where a row names a
blocker. Each one follows the pre-PR gate (`AGENTS.md`).

| PR  | Branch                              | Contents                                                                                                                                                                                          | Blocked by                        |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| M1  | `feat/minion-m1-marching`           | Phase M1                                                                                                                                                                                          | none                              |
| M2a | `feat/minion-m2a-brains-perception` | Brains in state, the `Controller` contract and registry, `AiSystem`; `state.space` with id-ordered `SpatialHash` queries and `Perception`; `HordeMembershipConsistentInvariant`; `dev-spawn-mobs` | M1                                |
| M4  | `feat/minion-m4-flow-fields`        | Phase M4                                                                                                                                                                                          | M1                                |
| M2b | `feat/minion-m2b-minion-controller` | `MinionController` and aggro content; `stop` clears the attack target; chasing `Combat.targetId`; the anchor holds while the leader engages                                                       | M2a; the damage pipeline (PR #34) |
| M2s | `feat/minion-structures`            | The part of Phase 2 sprint 2.1 the minions need: Stronghold, tower and gate entities from the map, `BreakabilityRule` with `StructureSystem` and `structure-destroyed` (no shield bars)           | M2b                               |
| M2c | `feat/minion-m2c-objectives-guards` | Lane objectives and gate holding; spawners on structure entities; `LaneAssessment`'s structure terms; `GuardController`, guard respawn, `GuardWithinLeashInvariant`                               | M2s                               |
| M3  | `feat/minion-m3-bot-laners`         | Phase M3                                                                                                                                                                                          | M2b                               |
| M5a | `feat/minion-m5a-modifiers`         | Phase M5, MVP items                                                                                                                                                                               | M2b                               |
| M5b | `feat/minion-m5b-if-time`           | Phase M5, MVP-if-time items                                                                                                                                                                       | M2c                               |
| M6  | `feat/minion-m6-camps-defenders`    | Phase M6                                                                                                                                                                                          | M2c; `Camp`, `CaptureSystem`      |
| M8  | `feat/minion-m8-rover-astar`        | Phase M8                                                                                                                                                                                          | M3, M4                            |

M4 needs only `WorldMap`, so it can run beside M2.

## 3. Interim stand-ins

Each stand-in is removed by the phase named.

| Stand-in                                                                                                                                                 | Used in | Replaced by                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| Nothing marks a lane flow field dirty: no event reports a gate or terrain change, so the time-sliced rebuild runs only when a test asks for it           | M4      | the gate and structure changes of doc 07 §10                          |
| No wall-avoidance term: the flow field's blocked corridor cells point back to open ground instead, and nothing resolves collisions                       | M4      | `CollisionSystem` and the wall-avoidance term (10 §8–§9)              |
| Horde sizes come from `GameConfig.match.hordeSizes` and cadences from the spawner records, until the owner decides where they live (doc 18 §10, item 2)  | M1      | the owner's answer, wherever it puts them                             |
| No entity kind is a turret, so the aggro list's `turret-attacking-ally-minion` entry never matches                                                       | M2b     | turret entities (sprint 2.3)                                          |
| Guard plans are content keyed by structure kind and the posts live in `state.guards`, since no `Spawner` component exists (07 §6 puts `GuardPlan` on it) | M2c     | the `Spawner` component (Phase 2 sprint 2.7)                          |
| The Stronghold's light guards fight in melee: no ranged attack exists until projectiles (sprint 2.3)                                                     | M2c     | the ranged attack strategy of sprint 2.3                              |
| Checkpoint defenders are not built: `CaptureSystem` (PR #49) is not on the phase branch, and its branch predates the minion work                         | M6      | M6's second half, once PR #49 lands                                   |
| No camp reward: clearing a camp emits `camp-cleared`, but nothing pays the clearing Legends                                                              | M6      | `ProgressionSystem` listening to `camp-cleared`                       |
| Horde separation falls off linearly with distance, not as 1/r (10 §12)                                                                                   | M1      | When playtests ask for it; the strategy is the one place to change    |
| The snapshot carries no hordes or team counters                                                                                                          | M1      | When a view or the HUD reads them (`MinimapView`, the developer menu) |

## Related

- [18-minion-system](../architecture/18-minion-system.md): the design these phases build.
- [Phase 2 plan](phase-2-structures-and-combat.md): sprints 2.1 (structures) and 2.2 (damage pipeline), the M2 blockers.
- [Phase 3 plan](phase-3-minions-hordes-and-ai.md): the Phase 3 items this plan does not cover.
- [Post-MVP backlog](backlog-post-mvp.md): the goal seam and horde redirection.
- [11-game-ai](../architecture/11-game-ai.md): the Rover and bot-Legend controllers M3 and M8 build, and the boss and turret controllers built outside this plan.
