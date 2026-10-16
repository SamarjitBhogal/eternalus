---
title: Minion system plan
description: The build plan for the minion system of architecture doc 18 - five phases M1 to M5 with their contents, blockers and done-when checks, and the interim stand-ins each phase uses with the phase that removes them; read this before picking up any minion, horde, guard, spawning or bot-goal task.
audience: [humans, agents]
status: draft
owner: SamarjitBhogal
last-reviewed: 2026-10-15
tags: [plan, minions, hordes, guards, spawning, ai]
related:
  - docs/architecture/18-minion-system.md
  - docs/plan/phase-3-minions-hordes-and-ai.md
  - docs/plan/phase-2-structures-and-combat.md
---

# Minion system plan

**Purpose.** Read this before you pick up minion work. It orders the design of
[18-minion-system](../architecture/18-minion-system.md) into five phases, M1 to M5, each with its
blockers and a done-when check, and lists the interim stand-ins a phase uses until a later one
replaces them. Section and decision numbers (§, MS-n) refer to doc 18. For the minion work, this
plan supersedes the order of Phase 3 sprints 3.1–3.4 and 3.7.

## 1. Phases and blockers

| Phase                         | Contents                                                                                                                                                                                                                                                                                                                       | Blockers                                                               | Done when                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **M1 Marching**               | Brains as plain data in state (replace the PROTO-01 `Brain`, delete the escort, DEC-35); light, medium and heavy mob content (`TUNE` placeholders, MS-18); `Horde` and `HordeSystem`; `SpatialHash`; `LaneFollowMovementStrategy`; `Spawner` data and `SpawnSystem` with the DISC-10 schedule, the worst lane and the unit cap | none                                                                   | Each team's hordes spawn on schedule and walk their lane to the enemy end; the replay hash is stable across two runs of the minion fixture |
| **M2 Fighting**               | `Perception`; `MinionController` with aggro content; lane-order objectives and gate holding; spawners on real structures; the worst lane's towers-lost term; `GuardController` and guard respawn                                                                                                                               | damage pipeline (sprint 2.2), structures and breakability (sprint 2.1) | The initial hordes of both teams fight to a result; guards never leave their perimeter in a soak; every FSM transition is tested           |
| **M3 Bot laners**             | The laner tree of doc 11 §4.2; the `LegendGoal` union; `set-legend-goal`                                                                                                                                                                                                                                                       | M2                                                                     | A laner pushes, retreats and returns; a set goal changes its lane within N ticks                                                           |
| **M4 Redirection**            | `move-to-lane`, `set-horde-goal`; flow fields per lane and team plus corridor fields; lane following on flow fields                                                                                                                                                                                                            | M2                                                                     | A redirected horde reaches the target lane with 0 stuck units, for `numLanes` 3 and 5                                                      |
| **M5 Modifiers and hard bot** | Before the MVP ships: strength by distance (MVP-full, DISC-24), enraged (MVP), the Rover (MVP, doc 11 §4.7). MVP-if-time: minion XP and level-up, the ghosted first wave, Tower Guardians                                                                                                                                      | M2 (Rover: M3)                                                         | Each modifier is a content table with a scenario test; the MVP items are done before the MVP ships, the MVP-if-time items when time allows |

Every phase also meets the cost and determinism rules of doc 11 §5–§6 and the performance targets
of the Phase 3 plan (pathing plus steering, tick time at `GameConfig.limits.maxUnitsPerTeam`).

## 2. Interim stand-ins

Each stand-in has a ceiling and is removed by the phase named.

| Stand-in                                                                                                                  | Used in | Replaced by                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| Spawners are plain data records keyed by `(team, source, laneIndex)`, spawning at the first point of the team's lane path | M1      | M2: the same records on the real structures |
| The worst lane scores enemy pressure only; the towers-lost term is 0 because no structure can fall                        | M1      | M2: both terms                              |
| The leader follows the lane path as waypoints, and `progress` is the index of the next waypoint                           | M1–M3   | M4: flow fields, behind the same strategy   |
| Without combat, opposing hordes jostle past each other and gather at the enemy end                                        | M1      | M2: they fight                              |

## Related

- [18-minion-system](../architecture/18-minion-system.md): the design these phases build.
- [Phase 2 plan](phase-2-structures-and-combat.md): sprints 2.1 (structures) and 2.2 (damage pipeline), the M2 blockers.
- [Phase 3 plan](phase-3-minions-hordes-and-ai.md)
