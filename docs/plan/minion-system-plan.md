---
title: Minion system plan
description: The build plan for the minion system of architecture doc 18 - five phases M1 to M5 with their contents, blockers and done-when checks, who builds the dependencies, the pull requests they ship as, the interim stand-ins each phase uses with the phase that removes them, and which Phase 3 items stay in Phase 3; read this before picking up any minion, horde, guard, spawning or bot-lane task.
audience: [humans, agents]
status: draft
owner: SamarjitBhogal
last-reviewed: 2026-10-17
tags: [plan, minions, hordes, guards, spawning, ai]
related:
  - docs/architecture/18-minion-system.md
  - docs/plan/phase-3-minions-hordes-and-ai.md
  - docs/plan/phase-2-structures-and-combat.md
  - docs/plan/backlog-post-mvp.md
---

# Minion system plan

**Purpose.** Read this before you pick up minion work. It orders the design of
[18-minion-system](../architecture/18-minion-system.md) into five phases, M1 to M5, each with its
blockers and a done-when check, and lists the interim stand-ins a phase uses until a later one
replaces them. Section and decision numbers (§, MS-n) refer to doc 18.

**Relation to Phase 3.** This plan supersedes these Phase 3 items only: sprint 3.1 (mob classes,
`Horde`, `HordeSystem`, the minion modifiers), sprint 3.2's flow fields and steering, sprint 3.3
(controllers, `MinionController`, targeting), sprint 3.4's `GuardController`, and sprint 3.7's
`BotLegendController` lane play. Everything else stays in the
[Phase 3 plan](phase-3-minions-hordes-and-ai.md): sprint 3.2's A\* for Legends, sprint 3.4's
forest camps and checkpoint assist spawns, sprint 3.7's `RoverController` and ability use, and
sprints 3.5, 3.6 and 3.8.

## 1. Phases and blockers

| Phase              | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Blockers                                                                       | Done when                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 Marching**    | Delete the PROTO-01 escort, its `AiSystem` and `Brain` (DEC-35); light, medium and heavy mob content; `Horde`, `HordeSystem` and the `ranks` formation; `SpatialHash`; `LaneFollowMovementStrategy`; `Spawner` data, `SpawnSystem` and the one-step spawn fulfilment (§3.2) with the DISC-10 schedule, `LaneAssessment` (§3.3) and the unit cap with its `TeamState` counters                                                                                                         | none                                                                           | Each team's hordes spawn on schedule and march their lane in formation to the enemy end; `git grep 'PROTOTYPE(PROTO-01)' -- packages apps` finds nothing; the replay hash is stable across two runs of the minion fixture |
| **M2 Fighting**    | Brains as plain data in state (moved from M1, where nothing reads one); `Perception`; `dev-spawn-mobs` hordes; `MinionController` with aggro content and the shared ranking helper; `stop` clears the attack target (`StopHandler`, 03 §3); lane-order objectives in the `WorldMap` structures index and gate holding; spawners on real structures; `LaneAssessment`'s structure terms; `GuardController`, `LeashedChaseMovementStrategy`, guard respawn, `GuardWithinLeashInvariant` | damage pipeline (sprint 2.2, PR #34), structures and breakability (sprint 2.1) | The opening hordes of both teams fight to a result; guards never leave their perimeter in a soak; every FSM transition is tested                                                                                          |
| **M3 Bot laners**  | Lane assignment at match setup (§8); the laner tree of doc 11 §4.2 playing its lane                                                                                                                                                                                                                                                                                                                                                                                                   | M2                                                                             | A laner pushes, retreats and returns; lanes respect `legendsPerLane` with the human counted and the Rover excluded                                                                                                        |
| **M4 Flow fields** | Flow fields per lane and team (10 §9, FR-038), including the Stronghold-to-gate ground; lane following on flow fields behind the same strategy                                                                                                                                                                                                                                                                                                                                        | M2                                                                             | Hordes reach the enemy end with 0 stuck units for `numLanes` 3 and 5; a gate change re-routes the field within the per-tick cell budget                                                                                   |
| **M5 Modifiers**   | Before the MVP ships: strength by distance (MVP-full, DISC-24) and enraged (MVP). MVP-if-time: minion XP and level-up, the ghosted first wave, Tower Guardians                                                                                                                                                                                                                                                                                                                        | M2                                                                             | Each modifier is a content table with a scenario test; the MVP items are done before the MVP ships, the MVP-if-time items when time allows                                                                                |

Every phase also meets the cost and determinism rules of doc 11 §5–§6 and the performance targets
of the Phase 3 plan (pathing plus steering, tick time at `GameConfig.limits.maxUnitsPerTeam`).

**Who builds the dependencies.** The damage pipeline (Phase 2 sprint 2.2) and structures (sprint
2.1) are built by other developers and consumed here. The minion work builds `SpatialHash` (Phase 1
sprint 1.3) and `Spawner`/`SpawnSystem` (Phase 2 sprint 2.7). Removing the PROTO-01 escort
overlaps work item W6 of the [multiplayer and scalability plan](multiplayer-and-scalability-plan.md);
whichever lands first does it.

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
| M2c | `feat/minion-m2c-objectives-guards` | Lane objectives and gate holding; spawners on structure entities; `LaneAssessment`'s structure terms; `GuardController`, guard respawn, `GuardWithinLeashInvariant`                               | M2b; structures (sprint 2.1)      |
| M3  | `feat/minion-m3-bot-laners`         | Phase M3                                                                                                                                                                                          | M2b                               |
| M5a | `feat/minion-m5a-modifiers`         | Phase M5, MVP items                                                                                                                                                                               | M2b                               |
| M5b | `feat/minion-m5b-if-time`           | Phase M5, MVP-if-time items                                                                                                                                                                       | M2c                               |

M4 needs only `WorldMap`, so it can run beside M2.

## 3. Interim stand-ins

Each stand-in is removed by the phase named.

| Stand-in                                                                                                                                                | Used in | Replaced by                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| Spawners are the map's structure features (position, team, lane), since structure entities do not exist yet                                             | M1      | M2: the structure entities                                            |
| `LaneAssessment` scores only `pushedBack`; damage-not-dealt is 1 and structures-lost 0 on every lane, because no structure has health or can fall       | M1      | M2: all three terms                                                   |
| The formation anchor and slots follow the lane polyline (seek with arrival), with no terrain-aware routing                                              | M1–M3   | M4: flow fields, behind the same strategy                             |
| Horde sizes come from `GameConfig.match.hordeSizes` and cadences from the spawner records, until the owner decides where they live (doc 18 §10, item 2) | M1      | the owner's answer, wherever it puts them                             |
| Without combat, opposing hordes jostle past each other and gather at the enemy end                                                                      | M1      | M2: they fight                                                        |
| The formation anchor never holds: not at a standing objective, not while the leader engages                                                             | M1      | M2: objectives and combat                                             |
| Horde separation falls off linearly with distance, not as 1/r (10 §12)                                                                                  | M1      | When playtests ask for it; the strategy is the one place to change    |
| The snapshot carries no hordes or team counters                                                                                                         | M1      | When a view or the HUD reads them (`MinimapView`, the developer menu) |

## Related

- [18-minion-system](../architecture/18-minion-system.md): the design these phases build.
- [Phase 2 plan](phase-2-structures-and-combat.md): sprints 2.1 (structures) and 2.2 (damage pipeline), the M2 blockers.
- [Phase 3 plan](phase-3-minions-hordes-and-ai.md): the Phase 3 items this plan does not cover.
- [Post-MVP backlog](backlog-post-mvp.md): the goal seam and horde redirection.
