---
title: Phase 3 — Minions, hordes and AI
description: Sprint checklists for the Mob family, the Horde composite, flow-field pathing, minion/guard/boss/bot controllers, the MatchDirector timeline and sim mode; read this before starting any Phase 3 task.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-29
tags: [plan, phase-3, minions, hordes, ai, pathing, match-director]
paths: ['packages/core/src/ai/**', 'packages/core/src/match/**', 'packages/core/src/map/**']
related:
  [
    'docs/plan/README.md',
    'docs/architecture/11-game-ai.md',
    'docs/architecture/12-game-story-and-match-director.md',
  ]
---

# Phase 3 — Minions, hordes and AI

## Purpose

Read this when you pick up a Phase 3 task or review the Phase 3 PR. Phase 3 turns the fighting
world of Phase 2 into a match: lane **hordes** of Light/Medium/Heavy mobs that march down flow
fields, minion and guard FSMs with data-driven aggro, bosses, Legend bots with behaviour trees,
the `MatchDirector` that runs the timeline from the 60 s countdown to the victory condition, and
**sim mode** so a bot-vs-bot match can run headless. This is where the 144-units-per-team
performance budget is proved. The word is **horde**, not "hoard".

**Minion work moved.** The [minion system plan](minion-system-plan.md) (design:
[18-minion-system](../architecture/18-minion-system.md)) supersedes the minion items of sprints
3.1–3.4 and 3.7; its §"Relation to Phase 3" lists exactly which. Read it before any sprint 3.1,
3.2, 3.3, 3.4 or 3.7 task. DEC-47 kept A\* for Legends, forest camps, checkpoint assist spawns
and the Rover here; MS-28 (below) moves them.

**Amended by doc 18 MS-28 (owner, 2026-10-27).** The minion plan also takes over the breakdown of
A\* for Legends (3.2), forest camps and checkpoint assist spawns (3.4), and the Rover and bot
ability use (3.7), as its phases M6 and M8 (its §1.1 lists every AI-driven entity). Nothing is
dropped and the work still ships in these weeks. Sprints 3.5, 3.6 (bosses: the minion system does
not control them) and 3.8 stay here.

- **Branch:** `phase/3-minions-hordes-and-ai` (stacked on `phase/2-…` until it merges).
- **Weeks:** 6–7 (2026-11-09 → 2026-11-20). Week 6: sprints 3.1, 3.2, 3.3, 3.5; week 7:
  sprints 3.4, 3.6, 3.7, 3.8. Sprint 3.2 may start in week 5 if `WorldMap` and
  `terrain-changed` are merged (roadmap stacking rule).
- **Requirement areas served:** "FR: hordes & spawning", "FR: AI-controlled units", "FR:
  Legends 10v10" (bots), "FR: forest camps", "FR: capture points" (checkpoint spawns), "FR:
  developer menu" (sim mode, spawn from origins), "NFR: performance (144 units/team)", "NFR:
  determinism".
- **Depends on:** Phase 2 (`SpawnSystem` v1, `CaptureSystem`, `DamagePipeline`,
  `terrain-changed`).

## Sprint 3.1 — Mob family, Horde composite and HordeSystem

Owner: _ (sim lane A). Week 6. Follows [04-entity-architecture.md](../architecture/04-entity-architecture.md).

- [ ] **`Mob` concrete weight classes** (`LightMob`, `MediumMob`, `HeavyMob`) with
      `MobDefinition` content (health, movement profile, reach, damage; light and dark display
      names). Owner: _. Test: each spawns via the factory with its definition. Done when: the
      three classes differ only by definition and strategy selection.
- [ ] **`Horde` composite** (not an entity: member ids, lane, formation, leader; sizes
      `TUNE` light 16 / medium 8 / heavy 4) + **`HordeSystem`** (formation slots, leader
      replacement, dissolve at 0 members, emits `horde-spawned` / `horde-dissolved`). Owner: _.
      Test: killing the leader promotes the next id; the horde dissolves when empty. Done when:
      `SpawnSystem` creates hordes through `HordeSystem`, not by spawning loose mobs.
- [ ] **Lane-distance strength scaling** (`TUNE`, game doc "Minions and lanes": minions are
      stronger near their home Stronghold and even out mid-lane) as a `Progression` modifier
      computed from lane distance. Owner: _. Test: the multiplier is symmetric for light and
      dark at mirrored positions. Done when: the curve is a content table.
- [ ] **Enraged and minion level-up** (`TUNE`: a lane's enemy minions gain `enraged` when a
      structure falls on that lane; a minion that kills a minion earns XP and levels after two
      kills, buffing nearby allies). Ascension on a Legend kill is **MVP-if-time**
      (`Recommendation:` implement as a status effect only if the sprint has slack). Owner: _.
      Test: `structure-destroyed` on lane 1 applies `enraged` to lane-1 enemy hordes only. Done
      when: both are event-driven with no system-to-system calls.

**Success metric:** 3 hordes × 16 mobs spawn at tick 0 from each Stronghold and reach the
enemy SpawnerTower on every lane with 0 stuck units, for `numLanes` 3 and 5.

## Sprint 3.2 — PathingSystem: flow fields and steering

Owner: _ (map owner). Weeks 5–6. Follows
[research §3](../research/game-architecture-and-performance-research.md#3-pathfinding-and-movement-for-lane-minions-and-large-unit-counts).

- [ ] **Flow fields per (lane, team)** (Dijkstra flood fill from the enemy Stronghold inside a
      corridor mask around the lane; `Uint16Array` integration field, `Int8Array` direction
      field; pre-allocated). Owner: _. Test: `numLanes: 5` yields 10 fields; every walkable
      corridor cell has a finite distance; fields are mirror-symmetric. Done when: fields are
      built from `WorldMap`, never authored.
- [ ] **Time-sliced rebuild** on `terrain-changed` (dirty per field, per-tick cell budget from
      `GameConfig`; the old field serves until the new one completes). Owner: _. Test: a bridge
      destruction marks the right fields dirty; rebuild completes within `ceil(cells / budget)`
      ticks; the tick cost never exceeds the budget. Done when: rebuild cost shows in
      `PerfOverlay` as its own measure.
- [ ] **Steering** (`MovementStrategy` `flow-field-follow` with bilinear sampling, separation
      through `SpatialHash`, arrival; priority wall-avoidance > separation > flow; vectors only,
      no angles). Owner: _. Test: 48 mobs in a corridor never overlap by more than a tolerance
      after 300 ticks; ID-ordered neighbour lists keep the replay hash stable. Done when: the
      steering loop allocates nothing per unit.
- [ ] **A\* for Legends and camp chases** (octile heuristic, string-pulling; used by bots only
      — the human moves with WASD). Owner: _. Test: shortest path around a stamped footprint.
      Done when: A\* is a second `MovementStrategy`, selected by definition.

**Success metric:** pathing plus steering for 288 mobs costs ≤ 2.5 ms per tick p95 in
`npm run bench` (`Recommendation:` budget split from the 8 ms tick), and a terrain change is
absorbed without a frame above 50 ms.

## Sprint 3.3 — MinionController FSM and aggro data

Owner: _ (sim lane B). Week 6. Follows [11-game-ai.md](../architecture/11-game-ai.md).

- [ ] **`Controller` interface + `AiSystem`** (controllers emit next-tick `Command`s, staggered
      by `entityId % cadence`; budget counter per tick). Owner: _. Test: 144 controllers with
      cadence 6 evaluate ≈ 24 per tick. Done when: `PlayerController` and bots implement the
      same interface.
- [ ] **`MinionController` FSM** (`marching → engaging → returning`) with **aggro rules as
      data** (`acquisitionRange`, `priorityOrder`, `aggroDurationTicks`, `aggroCooldownTicks`,
      re-evaluate between attacks; nearest objective in lane when idle). Owner: _. Test: a
      minion attacked by a Legend switches target per the priority list and returns to marching
      after the aggro duration. Done when: changing priorities is a content edit.
- [ ] **Targeting queries** (perception via `SpatialHash`, ID-ordered results). Owner: _. Test:
      results equal brute force and are deterministic. Done when: no controller scans all
      entities.

**Success metric:** the FSM tests cover every transition and the minion replay fixture (48 vs 48
for 3,000 ticks) hashes identically across runs.

## Sprint 3.4 — Guards, camps and respawn

Owner: _ (sim lane B). Week 7. Depends on 3.3.

- [ ] **`GuardController`** (tower and Stronghold guards never leave their perimeter; leash
      radius and return; `TUNE`: respawn every 2 minutes via the `Spawner`). Owner: _. Test: a
      guard pulled past the leash returns and heals per content; respawn at 3,600 ticks. Done
      when: the leash is a content value per structure kind.
- [ ] **Forest `Camp` behaviour** (`TUNE`: 6 per side between lanes; neutral mobs guard, chase
      inside a leash, activate after the camp cooldown; camp clear grants XP events for Phase 4).
      Owner: _. Test: camps are inert before their cooldown; clearing emits `camp-cleared`.
      Done when: corner camps (**MVP-if-time**) would be a second `Camp` definition only.
- [ ] **Checkpoint assist spawns** from Phase 2's `checkpoint-reached` (`TUNE`: medium assist
      mobs at 1, heavy plus light at 2, one massive mob at 3). Owner: _. Test: each checkpoint
      spawns the listed composition. Done when: the composition is a content table.

**Success metric:** in a 10-minute soak, 0 guards are found outside their perimeter by the
"guard leash" invariant and every respawn happens on its scheduled tick.

## Sprint 3.5 — MatchDirector and MatchTimeline

Owner: _ (sim lane A). Weeks 6–7. Follows
[12-game-story-and-match-director.md](../architecture/12-game-story-and-match-director.md).

- [ ] **`MatchDirector` (State pattern over `MatchPhase`)** with phases `countdown → early → quarter-mark → mid-game → late → ended`, driven by `MatchTimeline` content (`TUNE`: 60 s
      countdown with only the 3 initial hordes of 16 = 48 units per Stronghold; towers every
      60 s after; camps after cooldown; mini-bosses at the quarter mark on outer lanes; the
      Cathedral gem summons the GreaterBoss mid-game). Owner: _. Test: phase transitions at the
      exact ticks for a 20-minute timeline; every transition emits `match-phase-changed`. Done
      when: the timeline is a content table and the director has no numbers.
- [ ] **`MatchDirectorSystem` + victory and scoring** (Stronghold destroyed ends the match;
      points for capture/hold, structures and kills, `TUNE`; `MatchResult` with per-Legend
      scores). Owner: _. Test: razing a Stronghold produces a `MatchResult` on the same tick;
      scores are deterministic. Done when: `MatchResult` is a plain DTO for Phase 5 history.
- [ ] **Match clock and phase on the HUD** (`MatchClock`, `Announcer` messages per phase) via
      the bridge. Owner: _. Test: throttled dispatch. Done when: the HUD reads the store only.

**Success metric:** a scripted timeline test walks all phases and ends with a `MatchResult`;
the developer menu can jump to any phase through a debug command that stays replayable.

## Sprint 3.6 — Bosses

Owner: _ (sim lane A). Week 7. Depends on 3.3 and 3.5.

- [ ] **`Boss` abstract + `MiniBoss` + `GreaterBoss`** with `BossController` (multi-move FSM
      from content: move list, cooldowns, zone restriction; fights anyone from either team).
      Owner: _. Test: a boss never leaves its zone; move selection is seeded-random and
      replayable. Done when: a new boss is a definition with a move table.
- [ ] **Mini-boss rules** (`TUNE`: spawn at the quarter mark on the outer lanes with support
      mobs; its capture point cannot be captured while it lives; on defeat the team gets a
      permanent buff and ability XP). The final-hit consumable is an open question (INBOX).
      Owner: _. Test: `Capturable.cannotCaptureWhileBossAlive` blocks progress until death. Done
      when: rewards are events consumed by Phase 4 progression.
- [ ] **GreaterBoss ("Eternal", neutral)** summoned mid-game at the Cathedral; team-wide XP on
      kill; the final-hit Eternal form upgrade is **MVP-if-time** (Phase 4 hook). Owner: _.
      Test: summoning emits `boss-summoned` with a map-wide atmosphere event for the views.
      Done when: cut line 6 of the roadmap can remove it by a timeline content edit.

**Success metric:** both boss types complete a scripted fight against 10 bot Legends in the
soak without leaving their zones and with 0 invariant violations.

## Sprint 3.7 — Legend bots and the Rover

Owner: _ (AI owner). Week 7. Depends on 3.3.

- [ ] **`BotLegendController` behaviour tree** (node library: sequence, selector, condition,
      action, cooldown decorator; roles `laner` and `rover`; utility scoring for target and,
      later, ability choice; ticked at 5 Hz with `entityId % 6` stagger, per
      [research §7](../research/game-architecture-and-performance-research.md#7-game-ai-for-bots)).
      Owner: _. Test: a laner pushes its lane, retreats below a health threshold and returns to
      base to heal; 20 bots cost ≤ 1 ms per tick p95. Done when: leaves read snapshots and emit
      `Command`s only.
- [ ] **`RoverController`** (the "hard bot": reacts to structure health across lanes, mirrors
      or targets the human player). Owner: _. Test: the Rover moves to the lane with the lowest
      allied structure health within N ticks of a change. Done when: its weights are content.
- [ ] **Bot Legends use Phase 4 abilities through the same `Command`s** (stub: basic attack
      only until Phase 4). Owner: _. Test: the tree emits `cast-ability` commands that the
      `AbilitySystem` stub ignores safely. Done when: Phase 4 needs no controller change.

**Success metric:** 10 v 10 bots (no human) push lanes, take capture points and end a match
within the timeline cap in sim mode.

## Sprint 3.8 — Sim mode, soak at 144 per team and the AI budget

Owner: _ (sim lane + client lane). Week 7.

- [ ] **Sim mode** (developer menu: remove or add the user-controlled Legend; the match runs
      bot-vs-bot; also runnable headless in Node). Owner: _. Test: `Match` with no human
      controller completes a match; re-adding the human mid-match attaches `PlayerController`.
      Done when: the toggle is a debug `Command`.
- [ ] **Soak at 144 units per team + 20 Legends** for 18,000 ticks at `heavy` invariants;
      `npm run bench` prints per-system time (`Recommendation:` budget split: pathing 2.5 ms,
      collision 2 ms, AI 1.5 ms, combat 1 ms, rest 1 ms). Owner: _. Test: the soak. Done when:
      the numbers are in [PROGRESS.md](PROGRESS.md).
- [ ] **Replay determinism with AI** (5 seeds × full sim-mode match, hash every 100 ticks).
      Owner: _. Test: identical hashes across two runs and after a `Map` iteration audit. Done
      when: the fixtures are committed.

**Success metric:** tick ≤ 8 ms p95 at 144 per team + 20 Legends on the reference laptop; 0
invariant violations; identical hashes on replay.

## Success metrics (phase level)

| Metric                                        | Target                                                 |
| --------------------------------------------- | ------------------------------------------------------ |
| Tick time at 144 units/team + 20 Legends      | p95 ≤ 8 ms at 30 TPS on the reference laptop           |
| Bot-vs-bot sim match                          | completes with a `MatchResult` inside the timeline cap |
| Replay determinism with AI                    | 5 seeds × full match, identical hashes every 100 ticks |
| Stuck units (hordes reaching the enemy tower) | 0 in the lane test for `numLanes` 3 and 5              |
| Invariant violations (10-minute soak)         | 0                                                      |
| Flow-field rebuild after terrain change       | within budget, no frame > 50 ms                        |
| Coverage                                      | core ≥ 85%, client ≥ 55%                               |

## Exit criteria

1. All sprint metrics pass and are recorded in [PROGRESS.md](PROGRESS.md) with the machine.
2. Demo: start a match with one human Legend; watch the countdown, the first three hordes, tower
   spawns at 60 s, a camp activating, the quarter-mark mini-boss, and the match ending when a
   Stronghold falls; then switch to sim mode and let bots finish a match.
3. Architecture docs 11 and 12 match the code, or an ADR records the deviation.
4. Phase PR approved (sholtzman + map owner), CI green on Linux and Windows, merged by SamarjitBhogal.
5. The MVP-core line of the roadmap is now demoable end to end.

## Risks

| Risk                                             | Mitigation                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Performance target missed at 144 per team        | Budgets per system from day 1; `SpatialHash` and typed-array fields; stagger AI; profile before optimising.   |
| Bots look dumb or stuck in the demo              | Behaviour trees are content-driven; the sim-mode soak runs every night; Rover is a stretch within the sprint. |
| Determinism breaks with AI randomness            | All bot randomness from `SeededRandom`; ID-ordered iteration; the replay-with-AI fixture is a gate.           |
| Boss work explodes                               | Cut lines 5–6; bosses are definitions + one controller; the Eternal form upgrade is MVP-if-time.              |
| Two sim-lane sprints collide on `SystemPipeline` | Registration lines are append-only; merge the phase branch forward daily.                                     |

## Related

- [README.md](README.md)
- [phase-2-structures-and-combat.md](phase-2-structures-and-combat.md)
- [phase-4-legends-abilities-and-loadouts.md](phase-4-legends-abilities-and-loadouts.md)
- [PROGRESS.md](PROGRESS.md)
- [../architecture/11-game-ai.md](../architecture/11-game-ai.md)
- [../architecture/12-game-story-and-match-director.md](../architecture/12-game-story-and-match-director.md)
- [../architecture/06-map-and-minimap.md](../architecture/06-map-and-minimap.md)
- [../reference/game-design/02-entities-and-units.md](../reference/game-design/02-entities-and-units.md)
- [../reference/game-design/04-objectives-capture-points-and-bosses.md](../reference/game-design/04-objectives-capture-points-and-bosses.md)
- [../research/game-architecture-and-performance-research.md](../research/game-architecture-and-performance-research.md)
